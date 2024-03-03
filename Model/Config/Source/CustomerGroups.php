<?php
/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

namespace Devall\Wholesale\Model\Config\Source;

use Magento\Framework\Option\ArrayInterface;
use Magento\Customer\Model\ResourceModel\Group\Collection as GroupCollection;

/**
 * it returns all groups of customer except NOT LOGGED IN.
 */
class CustomerGroups implements ArrayInterface
{
    /**
     * @var GroupCollection
     */
    protected $groupCollection;

    /**
     * @param GroupCollection $groupCollection
     */
    public function __construct(
        GroupCollection $groupCollection
    ) {
        $this->groupCollection = $groupCollection;
    }

    /**
     * @return array
     */
    public function toOptionArray(): array
    {
        $groups = $this->groupCollection->toOptionArray();
        foreach ($groups as $key => $group) {
            if ($group['label'] == "NOT LOGGED IN") {
                unset($groups[$key]);
            }
        }
        return array_values($groups);
    }
}
