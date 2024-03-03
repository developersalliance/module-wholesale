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
 * The class checks if the module is turned on, returning the AS of the matrix
 */
class WrapperView implements ArgumentInterface
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
     * Returns devall.matrix or '', depending on whether the module is turned on.
     *
     * @return string
     */
    public function getRendererTemplate(): string
    {
        if ($this->customerGroupFeatureManager->isEnabled()) {
            return 'devall.matrix';
        }

        return '';
    }
}
