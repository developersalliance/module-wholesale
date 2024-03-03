/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

define([
    'jquery',
], function ($) {
    'use strict';

    return function (widget) {
        $.widget('mage.productValidate', widget, {

            /**
             * @private
             */
            _create: function () {
                this._super();

                if (this.options.isEnabled) {
                    $(this.options.addToCartButtonSelector).attr('disabled', true);
                } else {
                    $(this.options.addToCartButtonSelector).attr('disabled', false);
                }
            }
        });
        return $.mage.productValidate;
    }
});
