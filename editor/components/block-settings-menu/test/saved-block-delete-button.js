/**
 * External dependencies
 */
import { shallow } from 'enzyme';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import { SavedBlockDeleteButton } from '../saved-block-delete-button';

describe( 'SavedBlockDeleteButton', () => {
	it( 'matches the snapshot', () => {
		const wrapper = shallow(
			<SavedBlockDeleteButton
				role="menuitem"
				savedBlock={ { id: 123 } }
				onDelete={ noop }
			/>
		);

		expect( wrapper ).toMatchSnapshot();
	} );

	it( 'should allow deleting a saved block', () => {
		const onDelete = jest.fn();
		const wrapper = shallow(
			<SavedBlockDeleteButton
				savedBlock={ { id: 123 } }
				onDelete={ onDelete }
			/>
		);

		wrapper.find( 'IconButton' ).simulate( 'click' );
		expect( onDelete ).toHaveBeenCalledWith( 123 );
	} );
} );
