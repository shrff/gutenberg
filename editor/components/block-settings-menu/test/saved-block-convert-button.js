/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { SavedBlockConvertButton } from '../saved-block-convert-button';

describe( 'SavedBlockConvertButton', () => {
	it( 'should not render when isVisible false', () => {
		const wrapper = shallow(
			<SavedBlockConvertButton isVisible={ false } />
		);
		expect( wrapper.children() ).not.toExist();
	} );

	it( 'should allow converting a static block to a saved block', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<SavedBlockConvertButton
				isVisible
				isStaticBlock
				onConvertToSaved={ onConvert }
			/>
		);
		const button = wrapper.find( 'IconButton' ).first();
		expect( button.children().text() ).toBe( 'Create a Saved Block' );
		button.simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );

	it( 'should allow converting a saved block to static', () => {
		const onConvert = jest.fn();
		const wrapper = shallow(
			<SavedBlockConvertButton
				isVisible
				isStaticBlock={ false }
				onConvertToStatic={ onConvert }
			/>
		);
		const button = wrapper.find( 'IconButton' ).first();
		expect( button.children().text() ).toBe( 'Convert to Regular Block' );
		button.simulate( 'click' );
		expect( onConvert ).toHaveBeenCalled();
	} );
} );
