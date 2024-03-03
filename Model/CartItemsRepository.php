<?php
/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

namespace Devall\Wholesale\Model;

use Devall\Wholesale\Api\CartItemsRepositoryInterface;
use Magento\Authorization\Model\UserContextInterface;
use Magento\Catalog\Api\ProductRepositoryInterface;
use Magento\Framework\Message\ManagerInterface;
use Magento\Quote\Api\CartRepositoryInterface;
use Psr\Log\LoggerInterface;

/**
 * Repository for quote items.
 */
class CartItemsRepository implements CartItemsRepositoryInterface
{
    /**
     * @var ProductRepositoryInterface
     */
    private $productRepository;

    /**
     * @var UserContextInterface
     */
    private  $userContext;

    /**
     * @var CartRepositoryInterface
     */
    private  $quoteRepository;

    /**
     * @var LoggerInterface
     */
    private  $logger;

    /**
     * @var ManagerInterface
     */
    private $messageManager;

    /**
     * @param ManagerInterface $messageManager
     * @param LoggerInterface $logger
     * @param CartRepositoryInterface $quoteRepository
     * @param UserContextInterface $userContext
     * @param ProductRepositoryInterface $productRepository
     */
    public function __construct(
        ManagerInterface             $messageManager,
        LoggerInterface              $logger,
        CartRepositoryInterface      $quoteRepository,
        UserContextInterface         $userContext,
        ProductRepositoryInterface   $productRepository
    ) {
        $this->messageManager = $messageManager;
        $this->logger = $logger;
        $this->quoteRepository = $quoteRepository;
        $this->userContext = $userContext;
        $this->productRepository = $productRepository;
    }

    /**
     * @param array $items
     * @return void
     */
    public function save(array $items)
    {
        $customerId = $this->userContext->getUserId();

        if ($items) {
            try {
                foreach ($items as $item) {
                    $productId = $item->getItemId();
                    $qty = $item->getQty();

                    $product = $this->productRepository->getById($productId);
                    $quote = $this->quoteRepository->getActiveForCustomer($customerId);
                    $quote->addProduct($product, $qty);
                }
                $this->quoteRepository->save($quote);
                $this->messageManager->addSuccessMessage(__('Add to cart successfully!'));
            } catch (\Throwable $e) {
                $this->messageManager->addErrorMessage(__('We can\'t add this item to your shopping cart right now.'));
                $this->logger->debug("Exception thrown while trying to add items to cart from Wholesale module" . $e->getMessage());
            }
        }
    }
}
