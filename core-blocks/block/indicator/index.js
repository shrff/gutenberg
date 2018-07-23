/**
 * WordPress dependencies
 */
import { Tooltip, Dashicon } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

function SavedBlockIndicator( { title } ) {
	// translators: %s: title/name of the saved block
	const tooltipText = sprintf( __( 'Saved Block: %s' ), title );
	return (
		<Tooltip text={ tooltipText }>
			<span className="saved-block-indicator">
				<Dashicon icon="controls-repeat" />
			</span>
		</Tooltip>
	);
}

export default SavedBlockIndicator;
