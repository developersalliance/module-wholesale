<?php
/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

namespace Devall\Wholesale\ViewModel;

use Devall\Wholesale\Model\CustomerGroupFeatureManager;
use Magento\Framework\View\Element\Block\ArgumentInterface;

/**
 * Check if the customer is able to use the module.
 */
class AddToCartView implements ArgumentInterface
{
    /**
     * @var CustomerGroupFeatureManager
     */
    private $customerGroupFeatureManager;

    /**
     * @param CustomerGroupFeatureManager $customerGroupFeatureManager
     */
    public function __construct(
        CustomerGroupFeatureManager $customerGroupFeatureManager
    ) {
        $this->customerGroupFeatureManager = $customerGroupFeatureManager;
    }

    /**
     * If it is true, the customer will see as many quantity boxes as there are; otherwise, there will be only one.
     *
     * @return bool
     */
    public function isEnabled(): bool
    {

        return $this->customerGroupFeatureManager->isEnabled();
    }
}
