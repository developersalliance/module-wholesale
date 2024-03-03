/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

define([
    'jquery',
    'mage/translate',
    'underscore',
    'Magento_Customer/js/customer-data',
    'Magento_Catalog/js/price-utils',
    'Magento_Swatches/js/swatch-renderer'
], function ($, $t, _, CustomerData, priceUtils) {
    'use strict';

    /**
     * Renders swatch controls with options.
     *
     * This function processes configurable product options as simple data,
     * constructing them one by one. This means each attribute is unique to an attribute;
     * for instance, a specific color corresponds to only one size.
     *
     */
    $.widget('devall.SwatchRenderer', $.mage.SwatchRenderer, {
        options: {
            serviceUrl: "rest/V1/custom-cart/multiple-items"
        },

        _create: function () {
            this._super();
            this.formContainer = this.element.parents('#product_addtocart_form');

            return this;
        },

        /**
         * Render swatch options by part of config
         *
         * @param config
         * @param controlId
         * @param active
         * @returns {string}
         * @private
         */
        _RenderSwatchOptions: function (config, controlId, active) {
            var optionConfig = this.options.jsonSwatchConfig[config.id],
                optionClass = this.options.classes.optionClass,
                sizeConfig = this.options.jsonSwatchImageSizeConfig,
                moreLimit = parseInt(this.options.numberToShow, 10),
                moreClass = this.options.classes.moreButton,
                moreText = this.options.moreButtonText,
                countAttributes = 0,
                activeClass = '',
                html = '';

            if (!this.options.jsonSwatchConfig.hasOwnProperty(config.id)) {
                return '';
            }

            $.each(config.options, function (index) {
                var id,
                    type,
                    value,
                    thumb,
                    label,
                    width,
                    height,
                    attr,
                    swatchImageWidth,
                    swatchImageHeight;

                if (!optionConfig.hasOwnProperty(this.value_index)) {
                    return '';
                }

                // Add more button
                if (moreLimit === countAttributes++) {
                    html += '<a href="#" class="' + moreClass + '"><span>' + moreText + '</span></a>';
                }

                id = this.value_index;
                type = parseInt(optionConfig[id].type, 10);
                value = optionConfig[id].hasOwnProperty('value') ?
                    $('<i></i>').text(optionConfig[id].value).html() : '';
                thumb = optionConfig[id].hasOwnProperty('thumb') ? optionConfig[id].thumb : '';
                width = _.has(sizeConfig, 'swatchThumb') ? sizeConfig.swatchThumb.width : 110;
                height = _.has(sizeConfig, 'swatchThumb') ? sizeConfig.swatchThumb.height : 90;
                label = this.label ? $('<i></i>').text(this.label).html() : '';
                attr =
                    ' id="' + controlId + '-item-' + id + '"' +
                    ' index="' + index + '"' +
                    ' aria-checked="false"' +
                    ' aria-describedby="' + controlId + '"' +
                    ' tabindex="0"' +
                    ' data-option-type="' + type + '"' +
                    ' data-option-id="' + id + '"' +
                    ' data-option-label="' + label + '"' +
                    ' aria-label="' + label + '"' +
                    ' role="option"' +
                    ' data-thumb-width="' + width + '"' +
                    ' data-thumb-height="' + height + '"';

                attr += thumb !== '' ? ' data-option-tooltip-thumb="' + thumb + '"' : '';
                attr += value !== '' ? ' data-option-tooltip-value="' + value + '"' : '';

                swatchImageWidth = _.has(sizeConfig, 'swatchImage') ? sizeConfig.swatchImage.width : 30;
                swatchImageHeight = _.has(sizeConfig, 'swatchImage') ? sizeConfig.swatchImage.height : 20;

                if (active) {
                    activeClass = ' active';
                } else {
                    activeClass = ' inactive';
                }

                if (type === 0) {
                    // Text
                    html += '<div class="' + optionClass + activeClass + ' text" ' + attr + '>' + (value ? value : label) +
                        '</div>';
                }
                else if (type === 1) {
                    // Color
                    html += '<div class="' + optionClass + activeClass + ' color" ' + attr +
                        ' style="background: ' + value +
                        ' no-repeat center; background-size: initial;">' + '' +
                        '</div>';
                }
                else if (type === 2) {
                    // Image
                    html += '<div class="' + optionClass + activeClass + ' image" ' + attr +
                        ' style="background: url(' + value + ') no-repeat center; background-size: initial;width:' +
                        swatchImageWidth + 'px; height:' + swatchImageHeight + 'px">' + '' +
                        '</div>';
                } else if (type === 3) {
                    // Clear
                    html += '<div class="' + optionClass + activeClass + '" ' + attr + '></div>';
                } else {
                    // Default
                    html += '<div class="' + optionClass + activeClass + '" ' + attr + '>' + label + '</div>';
                }
            });

            return html;
        },

        /**
         * Render controls
         *
         * @private
         */
        _RenderControls: function () {
            var $widget = this,
                container = this.element.find("#swatch-devall-b2b>tbody"),
                showTooltip = this.options.showTooltip,
                classes = this.options.classes;

            $widget.optionsMap = {};

            $.each(this.options.jsonConfig.attributes, function () {
                var item = this

                $widget.optionsMap[item.id] = {};

                // Aggregate options array to hash (key => value)
                $.each(item.options, function () {
                    if (this.products.length > 0) {
                        $widget.optionsMap[item.id][this.id] = {
                            price: parseInt(
                                $widget.options.jsonConfig.optionPrices[this.products[0]].finalPrice.amount,
                                10
                            ),
                            products: this.products
                        }
                    }
                })

            })

            _.each(this.options.childData.childProducts, function (product, productId) {
                $widget._getActiveAttribute(product, productId, $widget);
            });

            if (showTooltip === 1) {
                // Connect Tooltip
                container
                    .find('[data-option-type="1"], [data-option-type="2"],' +
                        ' [data-option-type="0"], [data-option-type="3"]')
                    .SwatchRendererTooltip();
            }

            // Hide all elements below more button
            $('.' + classes.moreButton).nextAll().hide();

            // Handle events like click or change
            $widget._EventListener();

            // Rewind options
            $widget._Rewind(container);

            //Emulate click on all swatches from Request
            $widget._EmulateSelected($.parseQuery());
            $widget._EmulateSelected($widget._getSelectedAttributes());
        },

        /**
         *
         * @param product
         * @param productId
         * @param widget
         * @private
         */
        _getActiveAttribute: function (product, productId, widget) {
            var row = '<tr product-id="' + productId + '">',
                classes = widget.options.classes,
                container = widget.element.find("#swatch-devall-b2b>tbody"),
                controlLabelId,
                options;

            _.each(product, function (item, key) {
                if (typeof item === 'object') {
                    controlLabelId = 'data-option-label-' + item.code + '-' + item.id;
                    options = widget._RenderSwatchOptions(item, controlLabelId, true);

                    if (options === '') {
                        options = '<div class="swatch-option" id="data-option-label-size-' + item.id + '-item-' + item.options[0].value_index + '" attribute-id="' + item.id + '" attribute-value="' + item.options[0].value_index + '" data-option-id="' + item.options[0].value_index + '">' + item.options[0].label + '</div>';
                    }

                    row += '<td class="' + classes.attributeClass +
                        '" attribute-id="' + item.id + '" attribute-code="' + item.code + '" >' + options + '</td>';

                }
                else if (key === 'price') {
                    row += '<td class="devallWhole-' + key + '"><span class="devAll-seller-price">'
                        + widget.getFormattedPrice(item) + '</span>';
                } else if (key === 'stock') {
                    row += '<td class="devallWhole-' + key + '"><span class="devAll-seller-price">'
                        + item + '</span>';
                } else if (key === 'qty') {
                    row += '<td class="devallWhole-' + key + '">' + item + '</td>';
                } else if (key === 'subtotal') {
                    row += '<td class="devallWhole-' + key + '">' + item + '</td>';
                }
            });
            row += '</tr>';
            container.append(row);
        },

        getFormattedPrice: function (price) {
            return priceUtils.formatPrice(price);
        },

        /**
         * Event listener
         *
         * @private
         */
        _EventListener: function () {
            var $widget = this,
                detail = $widget.formContainer.find('#devall-summary'),
                formContainer = $widget.formContainer,
                subtotal = $widget.element.find('.devallWhole-subtotal span');

            subtotal.text($widget.getFormattedPrice(0));

            $widget.element.on('click', '.devall-inc', function () {
                return $widget._OnIncClick($(this), $widget);
            });

            $widget.element.on('click', '.devall-dec', function () {
                return $widget._OnDecClick($(this), $widget);
            });

            $widget.element.on('focusin', 'input', function () {
                $(this).data('val', $(this).val());
            }).on('change', 'input.devall-number-input', function () {
                return $widget._KeyupChange($(this), $widget);
            });

            detail.on('click', '.devall-delete-detail', function () {
                return $widget._RemoveItem($(this), $widget);
            });

            formContainer.find('.product-options-bottom').on('click', '#product-addtocart-button', function () {
                $('#product-addtocart-button span').text($t('Adding...'));
                this.setAttribute('disabled', 'disabled');
                return $widget._AddProductToCart($widget);
            });

            $widget.formContainer.on('mouseover mouseenter mouseleave mouseup mousedown', '.swatch-option', function () {
                return false;
            });

            $widget.element.on('keydown', function (e) {
                if (e.which === 13) {
                    e.preventDefault();
                }
            })
        },

        /**
         * Click to Inc
         *
         * @param $this
         * @param $widget
         * @private
         */
        _OnIncClick: function ($this, $widget) {
            var input = $this.parent().parent().find('.devall-number-input'),
                old = Number(input.val());

            input.val(old + 1);
            $widget._KeyupChange(input, $widget, true);
        },

        /**
         * Click to dec
         *
         * @param $this
         * @param $widget
         * @private
         */
        _OnDecClick: function ($this, $widget) {
            var input = $this.parent().parent().find('.devall-number-input'),
                old = Number(input.val());

            input.val(old - 1);
            $widget._KeyupChange(input, $widget, false);
        },

        /**
         * get a product price
         *
         * @param $widget
         * @param productId
         * @param qty
         * @returns {PaymentCurrencyAmount}
         * @private
         */
        _GetPrice: function ($widget, productId, qty) {
            var outProduct, tierPriceAll, finalPrice;

            if (typeof qty === 'undefined') {
                outProduct = $widget.options.childData.outProduct[productId];

                if (typeof outProduct !== 'undefined') {
                    return Number(outProduct.value.price);
                }
                return $widget.options.jsonConfig.optionPrices[productId].finalPrice.amount;
            }

            if (typeof $widget.options.jsonConfig.optionPrices[productId] !== 'undefined') {
                tierPriceAll = $widget.options.jsonConfig.optionPrices[productId].tierPrices;
                finalPrice = $widget.options.jsonConfig.optionPrices[productId].finalPrice.amount;
                if (!_.isEmpty(tierPriceAll)) {
                    _.some(tierPriceAll, function (tierPrice) {
                        if (qty >= tierPrice.qty) {
                            finalPrice = tierPrice.price;
                        } else {
                            return true;
                        }
                    });
                }
                $widget.element.find('#swatch-devall-b2b')
                    .find('tr[product-id="' + productId + '"] .devallWhole-price .devAll-seller-price')
                    .text(
                        $widget.getFormattedPrice(finalPrice)
                    );
            } else {
                finalPrice = $widget.options.childData.childProducts[productId].price;
            }

            return finalPrice;
        },

        /**
         * Input change
         *
         * @param $this
         * @param $widget
         * @param status
         * @private
         */
        _KeyupChange: function ($this, $widget, status) {
            var qty = Number($this.val()),
                productId = $this.attr('product-id'),
                oldQty = Number($this.data('val')),
                subtotal = $widget.formContainer.find('#subtotal-' + productId),
                productPrice = $widget._GetPrice($widget, productId, qty);

            if (qty < 0) {
                subtotal.html($widget.getFormattedPrice(0));
                $this.val(0);
            } else {
                subtotal.html($widget.getFormattedPrice(qty * productPrice));
                if (typeof status === "undefined") {
                    $widget._ChangeDetail($this, $widget, oldQty < qty);
                } else {
                    $widget._ChangeDetail($this, $widget, status);
                }
            }
        },

        /**
         *
         * @param $this
         * @param $widget
         * @param status
         * @private
         */
        _ChangeDetail: function ($this, $widget, status) {
            var input     = $this.parent().parent().find('.devall-number-input'),
                productId = input.attr('product-id'),
                product   = $widget.options.childData.childProducts[productId],
                old= Number(input.val()),
                productHtml,
                attributes;

            if (old >= 1) {
                if (status) {
                    productHtml = '<tr class="devall-simple" product-id="' + productId + '"><td>'
                        + product.sku + '</td>';
                    attributes  = '<td class="attributes">';

                    _.each(product, function (attribute) {
                        var controlLabelId = 'option-label-' + attribute.code + '-' + attribute.id,
                            options = $widget._RenderSwatchOptions(attribute, controlLabelId, false);

                        if (options === '' && attribute instanceof Object) {
                            options = '<div id="option-label-size-' + attribute.id + '-item-' + attribute.options[0].id
                                + '" class="swatch-option" attribute-id="' + attribute.id + '" attribute-value="'
                                + attribute.options[0].id + '" option-id="' + attribute.options[0].id + '">'
                                + attribute.options[0].label + '</div>';
                        }

                        attributes += options;
                    });

                    productHtml += attributes + '</td><td class="devallWhole-qty">' + old + '</td>'
                        + '<td class="devall-delete-detail"></td></tr>';
                    if ($('.devall-simple[product-id="' + productId + '"]').length < 1) {
                        $widget.formContainer.find('#devall-detail-total').append(productHtml);
                    } else {
                        $('.devall-simple[product-id="' + productId + '"] .devallWhole-qty').text(old);
                    }
                } else {
                    $widget.formContainer.find('#devall-detail-total')
                        .find('[product-id=' + productId + ']')
                        .children('.devallWhole-qty')
                        .html(old);
                }
            } else {
                $widget.formContainer.find('#devall-detail-total').find('[product-id=' + productId + ']').remove();
            }
            $widget._UpdateQty($widget);
        },

        /**
         *
         * @param $widget
         * @private
         */
        _UpdateQty: function ($widget) {
            var detailQty = $widget.formContainer.find('.devall-detail-qty'),
                detailSum = $widget.formContainer.find('.devall-detail-sum'),
                addCartBt = $widget.formContainer.find('#product-addtocart-button');

            detailQty.text(0);
            detailSum.text(0);

            _.each($widget.formContainer.find('#devall-detail-total').find('tbody>tr'), function (trEl) {
                var productId = trEl.getAttribute('product-id'),
                    qty = Number($('.devall-simple[product-id="' + productId + '"] .devallWhole-qty').text()),
                    price = $widget._GetPrice($widget, productId, qty),
                    total = Number(detailQty.text()),
                    sum = Number(detailSum.text());

                detailQty.text(total + qty);
                detailSum.text(sum + qty * price);

            })
            detailSum.text($widget.getFormattedPrice(detailSum.text()));
            if (Number(detailQty.text()) > 0) {
                $widget.formContainer.find('#devall-summary').css('display', 'block');
                addCartBt.removeAttr('disabled');
            } else {
                $widget.formContainer.find('#devall-summary').css('display', 'none');
                addCartBt.attr('disabled', 'disabled');
            }
        },

        /**
         *
         * @param $this
         * @param $widget
         * @private
         */
        _RemoveItem: function ($this, $widget) {
            var productId = $this.parent().attr('product-id'),
                product = $widget.options.childData.childProducts[productId],
                totalQtyEl = $('.devall-detail-qty'),
                totalSumEl = $('.devall-detail-sum'),
                qty = Number($this.parent().children('.devallWhole-qty').text()),
                inputEl = $widget.element.find('input[product-id=' + productId + ']'),
                QtyValue,
                newTotalValue;

            // remove and change in detail
            $this.parent().remove();
            QtyValue = Number(totalQtyEl.text()) - qty;
            totalQtyEl.text(QtyValue);
            newTotalValue = Number(totalSumEl.text()) - qty * Number(product.price);
            totalSumEl.text(newTotalValue);

            // change in attribute table
            inputEl.val(0);
            $('#subtotal-' + productId).text($widget.getFormattedPrice(0));
            $widget._UpdateQty($widget);
        },

        /**
         *
         * @param $widget
         * @private
         */
        _ResetAll: function ($widget) {
            $widget.formContainer.find('.devall-simple').remove();
            $widget.formContainer.find('.devallWhole-subtotal span').text($widget.getFormattedPrice(0));
            $widget.formContainer.find('.devallWhole-qty .devall-number-input').val(0);
            $widget._UpdateQty($widget);
        },

        /**
         * Add product to cart
         *
         * @param $widget
         * @private
         */
        _AddProductToCart: function ($widget) {
            var url = $widget.options.serviceUrl,
                items = {items : []};

            _.each($('#devall-detail-total .devall-simple'), function (item) {
                var productId = item.getAttribute('product-id'),
                    product;

                product = {
                    item_id: productId,
                    qty: $('.devall-simple[product-id="' + productId + '"] .devallWhole-qty').text()
                };

                items.items.push(product);
            });

            $.ajax({
                url: url,
                type: "POST",
                cache: false,
                processData: false,
                dataType: 'json',
                data: JSON.stringify(items),
                contentType: 'application/json',
                success: function () {
                    CustomerData.reload(['cart'], false);
                    $widget._ResetAll($widget);
                    $('.devall-number-input').val(0);
                    $('#product-addtocart-button span').text($t('Added'));
                },
                complete: function () {
                    $('#product-addtocart-button span').text($t('Add to Cart'));
                },
                error: function(xhr) {
                    console.log(xhr.responseText);
                }
            });
        },

    });
    return $.devall.SwatchRenderer;
})
