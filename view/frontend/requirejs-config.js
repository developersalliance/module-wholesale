/**
 * @author Developers-Alliance team
 * @copyright Copyright (c) 2024 Developers-alliance (https://www.developers-alliance.com)
 * @package Wholesale Order Grid for Magento 2
 */

var config = {
    map: {
        '*': {
            'configSwitchesCustom': 'Devall_Wholesale/js/swatch-renderer-devall',
        }
    },
    config: {
        mixins: {
            'Magento_Catalog/js/validate-product': {
                'Devall_Wholesale/js/validate-product-devall': true
            }
        }
    }
};
