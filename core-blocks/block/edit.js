/**
 * External dependencies
 */
import { noop, partial } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component, Fragment } from '@wordpress/element';
import { Placeholder, Spinner, Disabled } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { BlockEdit } from '@wordpress/editor';
import { compose } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import SavedBlockEditPanel from './edit-panel';
import SavedBlockIndicator from './indicator';

class SavedBlockEdit extends Component {
	constructor( { savedBlock } ) {
		super( ...arguments );

		this.startEditing = this.startEditing.bind( this );
		this.stopEditing = this.stopEditing.bind( this );
		this.setAttributes = this.setAttributes.bind( this );
		this.setTitle = this.setTitle.bind( this );
		this.save = this.save.bind( this );

		if ( savedBlock && savedBlock.isTemporary ) {
			// Start in edit mode when we're working with a newly created saved block
			this.state = {
				isEditing: true,
				title: savedBlock.title,
				changedAttributes: {},
			};
		} else {
			// Start in preview mode when we're working with an existing saved block
			this.state = {
				isEditing: false,
				title: null,
				changedAttributes: null,
			};
		}
	}

	componentDidMount() {
		if ( ! this.props.savedBlock ) {
			this.props.fetchSavedBlock();
		}
	}

	startEditing() {
		const { savedBlock } = this.props;

		this.setState( {
			isEditing: true,
			title: savedBlock.title,
			changedAttributes: {},
		} );
	}

	stopEditing() {
		this.setState( {
			isEditing: false,
			title: null,
			changedAttributes: null,
		} );
	}

	setAttributes( attributes ) {
		this.setState( ( prevState ) => {
			if ( prevState.changedAttributes !== null ) {
				return { changedAttributes: { ...prevState.changedAttributes, ...attributes } };
			}
		} );
	}

	setTitle( title ) {
		this.setState( { title } );
	}

	save() {
		const { savedBlock, onUpdateTitle, updateAttributes, block, onSave } = this.props;
		const { title, changedAttributes } = this.state;

		if ( title !== savedBlock.title ) {
			onUpdateTitle( title );
		}

		updateAttributes( block.clientId, changedAttributes );
		onSave();

		this.stopEditing();
	}

	render() {
		const { isSelected, savedBlock, block, isFetching, isSaving } = this.props;
		const { isEditing, title, changedAttributes } = this.state;

		if ( ! savedBlock && isFetching ) {
			return <Placeholder><Spinner /></Placeholder>;
		}

		if ( ! savedBlock || ! block ) {
			return <Placeholder>{ __( 'Block has been deleted or is unavailable.' ) }</Placeholder>;
		}

		let element = (
			<BlockEdit
				{ ...this.props }
				isSelected={ isEditing && isSelected }
				clientId={ block.clientId }
				name={ block.name }
				attributes={ { ...block.attributes, ...changedAttributes } }
				setAttributes={ isEditing ? this.setAttributes : noop }
			/>
		);

		if ( ! isEditing ) {
			element = <Disabled>{ element }</Disabled>;
		}

		return (
			<Fragment>
				{ element }
				{ ( isSelected || isEditing ) && (
					<SavedBlockEditPanel
						isEditing={ isEditing }
						title={ title !== null ? title : savedBlock.title }
						isSaving={ isSaving && ! savedBlock.isTemporary }
						onEdit={ this.startEditing }
						onChangeTitle={ this.setTitle }
						onSave={ this.save }
						onCancel={ this.stopEditing }
					/>
				) }
				{ ! isSelected && ! isEditing && <SavedBlockIndicator title={ savedBlock.title } /> }
			</Fragment>
		);
	}
}

export default compose( [
	withSelect( ( select, ownProps ) => {
		const {
			getSavedBlock,
			isFetchingSavedBlock,
			isSavingSavedBlock,
			getBlock,
		} = select( 'core/editor' );
		const { ref } = ownProps.attributes;
		const savedBlock = getSavedBlock( ref );

		return {
			savedBlock,
			isFetching: isFetchingSavedBlock( ref ),
			isSaving: isSavingSavedBlock( ref ),
			block: savedBlock ? getBlock( savedBlock.clientId ) : null,
		};
	} ),
	withDispatch( ( dispatch, ownProps ) => {
		const {
			fetchSavedBlocks,
			updateBlockAttributes,
			updateSavedBlockTitle,
			saveSavedBlock,
		} = dispatch( 'core/editor' );
		const { ref } = ownProps.attributes;

		return {
			fetchSavedBlock: partial( fetchSavedBlocks, ref ),
			updateAttributes: updateBlockAttributes,
			onUpdateTitle: partial( updateSavedBlockTitle, ref ),
			onSave: partial( saveSavedBlock, ref ),
		};
	} ),
] )( SavedBlockEdit );
