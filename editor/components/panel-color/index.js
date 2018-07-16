/**
 * External dependencies
 */
import { omit } from 'lodash';

/**
 * WordPress dependencies
 */
import { PanelColor as PanelColorComponent } from '@wordpress/components';
import { ifCondition, compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import ColorPalette from '../color-palette';
import withColorContext from '../color-palette/with-color-context';
import { getColorObjectByValue } from '../colors';

function PanelColor( { colors, title, colorValue, initialOpen, ...props } ) {
	const colorObject = getColorObjectByValue( colors, colorValue );
	return (
		<PanelColorComponent { ...{ title, colorName: colorObject && colorObject.name, colorValue, initialOpen } } >
			<ColorPalette
				value={ colorValue }
				{ ...omit( props, [ 'disableCustomColors' ] ) }
			/>
		</PanelColorComponent>
	);
}

export default compose( [
	withColorContext,
	ifCondition( ( { hasColorsToChoose } ) => hasColorsToChoose ),
] )( PanelColor );
