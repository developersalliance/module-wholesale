<?php
/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

namespace Devall\Wholesale\Model;

use Magento\Customer\Model\Context as ContextGroups;
use Magento\Framework\App\Config\ScopeConfigInterface;
use Magento\Framework\App\Http\Context;
use Magento\Store\Model\ScopeInterface;

/**
 * The class checks if the module is turned on, and if it is, determines which customer groups are able to use it.
 */
class CustomerGroupFeatureManager
{
    /**
     * The path returns if the module is enabled.
     */
    const MODULE_SWITCHER = "devall_b2b_general/main_settings/enabled";

    /**
     * The path returns values of customers' groups.
     */
    const MODULE_GROUPS = "devall_b2b_general/main_settings/enable_customer_group";

    /**
     * @var ScopeConfigInterface
     */
    public $scopeConfig;

    /**
     * @var Context
     */
    private $httpContext;

    /**
     * @param Context $httpContext
     * @param ScopeConfigInterface $scopeConfig
     */
    public function __construct(
        Context $httpContext,
        ScopeConfigInterface $scopeConfig
    ) {
        $this->httpContext = $httpContext;
        $this->scopeConfig = $scopeConfig;
    }

    /**
     * @return string
     */
    public function getConfigValue(): string
    {
        return $this->scopeConfig->getValue(
            self::MODULE_SWITCHER,
            ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * @return array
     */
    public function getConfigValueCustomerGroup(): array
    {
        $groups =  $this->scopeConfig->getValue(self::MODULE_GROUPS, ScopeInterface::SCOPE_STORE);

        return $groups ? explode(',', $groups) : [0];
    }

    /**
     * @return int
     */
    public function getGroupCustomerId(): int
    {
        if ($this->httpContext->getValue(ContextGroups::CONTEXT_AUTH)) {
            $customersGroupsId= $this->httpContext->getValue(ContextGroups::CONTEXT_GROUP);
        } else {
            $customersGroupsId = 0;
        }

        return $customersGroupsId;
    }

    /**
     * Retrieve the module value and verify if the customer's ID is within the allowed customer groups.
     *
     * @return bool
     */
    public function isEnabled(): bool
    {
        $customerGroupId = $this->getGroupCustomerId();
        $customerGroupsIds = $this->getConfigValueCustomerGroup();

        if ($this->getConfigValue() && in_array($customerGroupId, $customerGroupsIds)) {
            return true;
        }

        return false;
    }
}
