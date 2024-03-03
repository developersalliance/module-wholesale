<?php
/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

namespace Devall\Wholesale\ViewModel;

use Magento\Catalog\Api\Data\ProductInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Catalog\Helper\Data;
use Magento\CatalogInventory\Model\Stock\StockItemRepository;
use Magento\Framework\Escaper;
use Magento\Framework\Exception\InputException;
use Magento\Framework\Exception\NoSuchEntityException;
use Magento\Framework\Serialize\Serializer\Json;
use Magento\Framework\View\Element\Block\ArgumentInterface;
use Magento\ConfigurableProduct\Api\OptionRepositoryInterface;
use Magento\ConfigurableProduct\Model\Product\Type\Configurable;
use Magento\Swatches\ViewModel\Product\Renderer\Configurable as ConfigurableViewModel;
use Psr\Log\LoggerInterface;

/**
 * The RendererView class returns configurable products to be converted into simple products.
 */
class RendererView implements ArgumentInterface
{
    /**
     * @var ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @var Data
     */
    private $catalogHelper;

    /**
     * @var OptionRepositoryInterface
     */
    private $optionRepository;

    /**
     * @var StockItemRepository
     */
    private $stockItemRepository;
    /**
     * @var Json
     */
    private $json;

    /**
     * @var LoggerInterface
     */
    private $logger;

    /**
     * @var Escaper
     */
    private $escaper;

    /**
     * @var ConfigurableViewModel
     */
    private $configurableViewModel;

    /**
     * @param Data $catalogHelper
     * @param OptionRepositoryInterface $optionRepository
     * @param ProductRepositoryInterface $productRepository
     * @param StockItemRepository $stockItemRepository
     * @param Json $json
     * @param LoggerInterface $logger
     * @param Escaper $escaper
     * @param ConfigurableViewModel $configurableViewModel
     */
    public function __construct(
        Data $catalogHelper,
        OptionRepositoryInterface $optionRepository,
        ProductRepositoryInterface $productRepository,
        StockItemRepository $stockItemRepository,
        Json $json,
        LoggerInterface $logger,
        Escaper $escaper,
        ConfigurableViewModel $configurableViewModel
    ) {
        $this->optionRepository = $optionRepository;
        $this->productRepository = $productRepository;
        $this->catalogHelper = $catalogHelper;
        $this->stockItemRepository = $stockItemRepository;
        $this->json = $json;
        $this->logger = $logger;
        $this->escaper = $escaper;
        $this->configurableViewModel = $configurableViewModel;
    }

    /**
     * Retrieves configurable product swatch data.
     *
     * @return string JSON encoded swatch data.
     */
    public function getSwatchData(): string
    {
        $configurableData = [
            'childProducts' => $this->getAllowProducts(),
        ];

        return $this->json->serialize($configurableData);
    }

    /**
     * Retrieve the current product.
     *
     * @return ProductInterface|null
     */
    protected function getCurrentProduct(): ?ProductInterface
    {
        try {
            $productId = $this->catalogHelper->getProduct()->getId();
            return $this->productRepository->getById($productId);
        } catch (NoSuchEntityException $e) {
            $this->logger->debug($e->getMessage());
        }

        return null;
    }

    /**
     * Retrieve child products for the configurable product.
     *
     * @return ProductInterface[]
     */
    public function getAllowProducts(): array
    {
        try {
            $currentProduct = $this->getCurrentProduct();
            if ($currentProduct->getTypeId() === Configurable::TYPE_CODE) {
                return $this->getChildProducts($currentProduct);
            }

        } catch (NoSuchEntityException $ex) {
            $this->logger->debug($ex->getMessage());
        }

        return [];
    }

    /**
     * Retrieve allowed attributes for the configurable product.
     *
     * @return array|null
     */
    public function getAllowAttributes(): ?array
    {
        try {
            $currentProduct = $this->getCurrentProduct();
            return $currentProduct->getTypeInstance()->getUsedProducts($currentProduct);
        } catch (NoSuchEntityException $e) {
            $this->logger->debug($e->getMessage());
        }

        return null;
    }

    /**
     * Find the configurable product options and return them one by one along with their attributes.
     *
     * @param ProductInterface $product.
     * @return array.
     */
    public function getChildProducts(ProductInterface $product): array
    {
        $optionsData = [];

        try {
            $productSku = $product->getSku();
            $options = $this->optionRepository->getList($productSku);
            foreach ($this->getAllowAttributes() as $childProduct) {
                $childProductId = $childProduct->getId();
                $quantity = $this->stockItemRepository->get($childProductId);
                $optionsData[$childProductId] = $this->prepareChildProductData($childProduct, array_reverse($options), $quantity);
                $optionsData[$childProductId]['qty'] = $this->getQtyToHtml($childProductId, (int)$quantity->getQty());
                $optionsData[$childProductId]['subtotal'] = $this->getSubtotalToHtml($childProductId);
                $optionsData [$childProductId]['subtotal'] = $this->getSubtotalToHtml($childProductId);

            }

        } catch (NoSuchEntityException|InputException $ex) {
            $this->logger->debug($ex->getMessage());
        }

        return $optionsData;
    }

    /**
     * Create a list containing the data for each product.
     *
     * @param $childProduct
     * @param $options
     * @param $quantity
     * @return array
     */
    protected function prepareChildProductData($childProduct, $options, $quantity): array
    {
        $attributeValues = [];

        $childProductData = [
            'sku' => $childProduct->getSku(),
            'price' => (int)$childProduct->getPrice(),
            'stock' => (int)$quantity->getQty(),
        ];

        foreach ($options as $attribute) {
            $attributeValues[$attribute->getLabel()] = $this->prepareAttributeData($attribute, $childProduct);
        }

        return array_merge($attributeValues, $childProductData);
    }

    /**
     * Filter the configurable product options and add those as simple data.
     *
     * @param $attributesData
     * @param $attribute
     * @return array
     */
    protected function prepareAttributeData($attributesData, $attribute): array
    {
        $attributeData['code'] = $attributesData->getProductAttribute()->getAttributeCode();;
        $attributeData['id'] = $attributesData->getAttributeId();
        $attributeData['label'] = $attributesData->getLabel();
        $attributeData['options'] = [];
        $size = $attribute->getSize();
        $color = $attribute->getColor();

        foreach ($attributesData->getOptions() as $optionValues) {
            if ($optionValues['value_index'] == $size) {
                $attributeData['options'][] = $optionValues;
            } elseif ($optionValues['value_index'] == $color) {
                $attributeData['options'][] = $optionValues;
            }
        }

        return $attributeData;
    }

    /**
     * Returns as an input field in the frontend with a determined maximum quantity, data validation, and the simple product's ID.
     *
     * @param $childProductId
     * @param $quantity
     * @return string
     */
    public function getQtyToHtml($childProductId, $quantity): string
    {
        return <<<HTML
                <input type="number" value="0" min="0" max="{$quantity}" class="devall-number-input" product-id="{$childProductId}" data-validate="{$this->escaper->escapeHtml(json_encode($this->getQuantityValidators()))}" oninput="this.value = Math.abs(this.value)" />
                <div id="devall-number"><div class="devall-inc"></div><div class="devall-dec"></div></div>
                HTML;
    }

    /**
     * Returns that a number is required.
     *
     * @return array
     */
    public function getQuantityValidators(): array
    {
        $validators = [];
        $validators['required-number'] = true;
        return $validators;
    }

    /**
     * Returns the child product's ID, also known as the Simple Product ID.
     *
     * @param $childProductId
     * @return string
     */
    public function getSubtotalToHtml($childProductId): string
    {
        return <<<HTML
            <span id="subtotal-{$childProductId}"></span>
            HTML;
    }

    /**
     * Get config if swatch tooltips should be rendered.
     *
     * @return string
     */
    public function getShowSwatchTooltip(): string
    {
        return $this->configurableViewModel->getShowSwatchTooltip();
    }
}


