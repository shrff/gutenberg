/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	BlockControls,
	BlockAlignmentToolbar,
	InnerBlocks,
} from '@wordpress/editor';

/**
 * Internal dependencies
 */
import './style.scss';
import './editor.scss';

const MEDIA_POSITIONS = [ 'left', 'right' ];

export const name = 'core/half-media';

export const settings = {
	title: __( 'Half Media' ),

	icon: 'columns',

	category: 'layout',

	attributes: {
		mediaPosition: {
			type: 'string',
			default: 'left',
		},
	},

	supports: {
		align: [ 'wide', 'full' ],
	},

	edit( { attributes, setAttributes } ) {
		return (
			<div className={ classnames(
				'half-media',
				{ 'has-media-on-the-right': 'right' === attributes.mediaPosition }
			) }>
				<BlockControls>
					<BlockAlignmentToolbar
						controls={ MEDIA_POSITIONS }
						value={ attributes.mediaPosition }
						onChange={ ( mediaPosition ) => setAttributes( { mediaPosition } ) }
					/>
				</BlockControls>
				<InnerBlocks
					template={ [
						[ 'core/half-media-media-area' ],
						[ 'core/half-media-content-area' ],
					] }
					templateLock="all"
				/>
			</div>
		);
	},

	save( { attributes } ) {
		return (
			<div className={ classnames(
				'half-media',
				{ 'has-media-on-the-right': 'right' === attributes.mediaPosition }
			) }>
				<InnerBlocks.Content />
			</div>
		);
	},
};
