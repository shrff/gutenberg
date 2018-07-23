/**
 * External dependencies
 */
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { compose } from '@wordpress/compose';
import { IconButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { isSavedBlock } from '@wordpress/blocks';
import { withSelect, withDispatch } from '@wordpress/data';

export function SavedBlockDeleteButton( { savedBlock, onDelete, itemsRole } ) {
	if ( ! savedBlock ) {
		return null;
	}

	return (
		<IconButton
			className="editor-block-settings-menu__control"
			icon="no"
			disabled={ savedBlock.isTemporary }
			onClick={ () => onDelete( savedBlock.id ) }
			role={ itemsRole }
		>
			{ __( 'Delete Saved Block' ) }
		</IconButton>
	);
}

export default compose( [
	withSelect( ( select, { clientId } ) => {
		const { getBlock, getSavedBlock } = select( 'core/editor' );
		const block = getBlock( clientId );
		return {
			savedBlock: block && isSavedBlock( block ) ? getSavedBlock( block.attributes.ref ) : null,
		};
	} ),
	withDispatch( ( dispatch, { onToggle = noop } ) => {
		const {
			deleteSavedBlock,
		} = dispatch( 'core/editor' );

		return {
			onDelete( id ) {
				// TODO: Make this a <Confirm /> component or similar
				// eslint-disable-next-line no-alert
				const hasConfirmed = window.confirm( __(
					'Are you sure you want to delete this Saved Block?\n\n' +
					'It will be permanently removed from all posts and pages that use it.'
				) );

				if ( hasConfirmed ) {
					deleteSavedBlock( id );
					onToggle();
				}
			},
		};
	} ),
] )( SavedBlockDeleteButton );
