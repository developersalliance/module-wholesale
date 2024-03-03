<?php
/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

namespace Devall\Wholesale\Api;

use Magento\Framework\Exception\CouldNotSaveException;
use Magento\Quote\Api\Data\CartItemInterface;

/**
 * Interface CartItemsRepositoryInterface
 * @api
 */
interface CartItemsRepositoryInterface
{
    /**
     * Add/update the specified cart items.
     *
     * @param CartItemInterface[] $items The items.
     * @return void
     * @throws CouldNotSaveException The specified items could not be saved to the cart.
     */
    public function save(array $items);
}
