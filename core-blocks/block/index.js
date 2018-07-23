/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'core/block';

export const settings = {
	title: __( 'Saved Block' ),
	category: 'saved',

	attributes: {
		ref: {
			type: 'number',
		},
	},

	supports: {
		customClassName: false,
		html: false,
		inserter: false,
	},

	edit,

	save: () => null,
};
