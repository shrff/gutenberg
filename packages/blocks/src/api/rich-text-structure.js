import { find } from 'lodash';

/**
 * Browser dependencies
 */

const { TEXT_NODE, ELEMENT_NODE } = window.Node;

export function createWithSelection( element, range, multiline, settings ) {
	if ( ! multiline ) {
		return createRecord( element, range, settings );
	}

	if ( ! element || ! element.hasChildNodes() ) {
		return {
			value: [],
			selection: {},
		};
	}

	return Array.from( element.childNodes ).reduce( ( acc, child, index ) => {
		if ( child.nodeName.toLowerCase() === multiline ) {
			const { selection, value } = createRecord( child, range, settings );

			if ( range ) {
				if ( selection.start !== undefined ) {
					acc.selection.start = [ index ].concat( selection.start );
				} else if ( child === range.startContainer ) {
					acc.selection.start = [ index ];
				}

				if ( selection.end !== undefined ) {
					acc.selection.end = [ index ].concat( selection.end );
				} else if ( child === range.endContainer ) {
					acc.selection.end = [ index ];
				}
			}

			acc.value.push( value );
		}

		return acc;
	}, {
		value: [],
		selection: {},
	} );
}

export function create( element, multiline, settings ) {
	return createWithSelection( element, null, multiline, settings ).value;
}

function createRecord( element, range, settings = {} ) {
	if ( ! element ) {
		return {
			value: {
				formats: [],
				text: '',
			},
			selection: {},
		};
	}

	const {
		removeNodeMatch = () => false,
		unwrapNodeMatch = () => false,
		filterString = ( string ) => string,
	} = settings;

	if (
		element.nodeName === 'BR' &&
		! removeNodeMatch( element ) &&
		! unwrapNodeMatch( element )
	) {
		return {
			value: {
				formats: Array( 1 ),
				text: '\n',
			},
			selection: {},
		};
	}

	if ( ! element.hasChildNodes() ) {
		return {
			value: {
				formats: [],
				text: '',
			},
			selection: {},
		};
	}

	return Array.from( element.childNodes ).reduce( ( accumulator, node ) => {
		const { formats } = accumulator.value;

		if ( node.nodeType === TEXT_NODE ) {
			if ( range ) {
				if ( node === range.startContainer ) {
					accumulator.selection.start = accumulator.value.text.length + filterString( node.nodeValue.slice( 0, range.startOffset ) ).length;
				}

				if ( node === range.endContainer ) {
					accumulator.selection.end = accumulator.value.text.length + filterString( node.nodeValue.slice( 0, range.endOffset ) ).length;
				}
			}

			const text = filterString( node.nodeValue, accumulator.selection );
			accumulator.value.text += text;
			formats.push( ...Array( text.length ) );
		} else if ( node.nodeType === ELEMENT_NODE ) {
			if ( removeNodeMatch( node ) ) {
				return accumulator;
			}

			if ( range ) {
				if (
					node.parentNode === range.startContainer &&
					node === range.startContainer.childNodes[ range.startOffset ]
				) {
					accumulator.selection.start = accumulator.value.text.length;
				}

				if (
					node.parentNode === range.endContainer &&
					node === range.endContainer.childNodes[ range.endOffset ]
				) {
					accumulator.selection.end = accumulator.value.text.length;
				}
			}

			let format;

			if ( ! unwrapNodeMatch( node ) ) {
				const type = node.nodeName.toLowerCase();
				const attributes = getAttributes( node, settings );

				format = attributes ? { type, attributes } : { type };
			}

			const { value, selection } = createRecord( node, range, settings );
			const text = value.text;
			const start = accumulator.value.text.length;

			if ( format && text.length === 0 ) {
				format.object = true;

				if ( formats[ start ] ) {
					formats[ start ].unshift( format );
				} else {
					formats[ start ] = [ format ];
				}
			} else {
				accumulator.value.text += text;

				let i = value.formats.length;

				while ( i-- ) {
					const index = start + i;

					if ( format ) {
						if ( formats[ index ] ) {
							formats[ index ].push( format );
						} else {
							formats[ index ] = [ format ];
						}
					}

					if ( value.formats[ i ] ) {
						if ( formats[ index ] ) {
							formats[ index ].push( ...value.formats[ i ] );
						} else {
							formats[ index ] = value.formats[ i ];
						}
					}
				}
			}

			if ( selection.start !== undefined ) {
				accumulator.selection.start = start + selection.start;
			}

			if ( selection.end !== undefined ) {
				accumulator.selection.end = start + selection.end;
			}
		}

		return accumulator;
	}, {
		value: {
			formats: [],
			text: '',
		},
		selection: {},
	} );
}

export function apply( value, current, multiline ) {
	const { body: future, selection } = toDOM( value, multiline );
	let i = 0;

	while ( future.firstChild ) {
		const currentChild = current.childNodes[ i ];
		const futureNodeType = future.firstChild.nodeType;

		if ( ! currentChild ) {
			current.appendChild( future.firstChild );
		} else if (
			futureNodeType !== currentChild.nodeType ||
			futureNodeType !== TEXT_NODE ||
			future.firstChild.nodeValue !== currentChild.nodeValue
		) {
			current.replaceChild( future.firstChild, currentChild );
		} else {
			future.removeChild( future.firstChild );
		}

		i++;
	}

	while ( current.childNodes[ i ] ) {
		current.removeChild( current.childNodes[ i ] );
	}

	const { node: startContainer, offset: startOffset } = getNodeByPath( current, selection.startPath );
	const { node: endContainer, offset: endOffset } = getNodeByPath( current, selection.endPath );

	const sel = window.getSelection();
	const range = current.ownerDocument.createRange();
	const isCollapsed = startContainer === endContainer && startOffset === endOffset;

	if ( isCollapsed && startOffset === 0 && startContainer.nodeType === TEXT_NODE ) {
		startContainer.insertData( 0, '\uFEFF' );
		range.setStart( startContainer, 1 );
		range.setEnd( endContainer, 1 );
	} else {
		range.setStart( startContainer, startOffset );
		range.setEnd( endContainer, endOffset );
	}

	sel.removeAllRanges();
	sel.addRange( range );
}

function getAttributes( element, settings = {} ) {
	if ( ! element.hasAttributes() ) {
		return;
	}

	const {
		removeAttributeMatch = () => false,
	} = settings;

	return Array.from( element.attributes ).reduce( ( acc, { name, value } ) => {
		if ( ! removeAttributeMatch( name ) ) {
			acc = acc || {};
			acc[ name ] = value;
		}

		return acc;
	}, undefined );
}

function createPathToNode( node, rootNode, path ) {
	const parentNode = node.parentNode;
	let i = 0;

	while ( ( node = node.previousSibling ) ) {
		i++;
	}

	path = [ i, ...path ];

	if ( parentNode !== rootNode ) {
		path = createPathToNode( parentNode, rootNode, path );
	}

	return path;
}

function getNodeByPath( node, path ) {
	path = [ ...path ];

	while ( node && path.length > 1 ) {
		node = node.childNodes[ path.shift() ];
	}

	return {
		node,
		offset: path[ 0 ],
	};
}

export function toDOM( { value, selection = {} }, multiline, _tag ) {
	const doc = document.implementation.createHTMLDocument( '' );
	const range = doc.createRange && doc.createRange();
	let { body } = doc;

	if ( multiline ) {
		value.forEach( ( piece ) => {
			body.appendChild( toDOM( { value: piece }, false, multiline ).body );
		} );

		return {
			body,
			range,
		};
	}

	const { formats, text } = value;
	const { start, end } = selection;
	let startPath = [];
	let endPath = [];

	if ( _tag ) {
		body = body.appendChild( doc.createElement( _tag ) );
	}

	for ( let i = 0, max = text.length; i < max; i++ ) {
		const character = text.charAt( i );
		const nextFormats = formats[ i ] || [];
		let pointer = body.lastChild || body.appendChild( doc.createTextNode( '' ) );

		if ( nextFormats ) {
			nextFormats.forEach( ( { type, attributes, object } ) => {
				if ( pointer && type === pointer.nodeName.toLowerCase() ) {
					pointer = pointer.lastChild;
					return;
				}

				const newNode = doc.createElement( type );
				const parentNode = pointer.parentNode;

				for ( const key in attributes ) {
					newNode.setAttribute( key, attributes[ key ] );
				}

				parentNode.appendChild( newNode );
				pointer = ( object ? parentNode : newNode ).appendChild( doc.createTextNode( '' ) );
			} );
		}

		if ( pointer.nodeType === TEXT_NODE ) {
			pointer.appendData( character );
		} else {
			pointer = pointer.parentNode.appendChild( doc.createTextNode( character ) );
		}

		if ( start === i ) {
			startPath = createPathToNode( pointer, body, [ pointer.nodeValue.length - 1 ] );
		}

		if ( end === i ) {
			endPath = createPathToNode( pointer, body, [ pointer.nodeValue.length - 1 ] );
		}
	}

	const last = text.length;

	if ( formats[ last ] ) {
		formats[ last ].reduce( ( element, { type, attributes } ) => {
			const newNode = doc.createElement( type );

			for ( const key in attributes ) {
				newNode.setAttribute( key, attributes[ key ] );
			}

			return element.appendChild( newNode );
		}, body );
	}

	return {
		body,
		selection: { startPath, endPath },
	};
}

export function toString( record, multiline ) {
	return toDOM( { value: record }, multiline ).body.innerHTML;
}

export function concat( record, ...records ) {
	if ( Array.isArray( record ) ) {
		return record.concat( ...records );
	}

	return records.reduce( ( accu, { formats, text } ) => {
		accu.text += text;
		accu.formats.push( ...formats );
		return accu;
	}, { ...record } );
}

export function isEmpty( record ) {
	if ( Array.isArray( record ) ) {
		return record.length === 0 || ( record.length === 1 && isEmpty( record[ 0 ] ) );
	}

	const { text, formats } = record;

	return text.length === 0 && formats.length === 0;
}

export function splice( { formats, text, selection, value }, start, deleteCount, textToInsert = '', formatsToInsert = [] ) {
	if ( selection ) {
		const diff = textToInsert.length - deleteCount;

		return {
			selection: {
				start: selection.start + ( selection.start > start ? diff : 0 ),
				end: selection.end + ( selection.end > start + diff ? diff : 0 ),
			},
			value: splice( value, start, deleteCount, textToInsert, formatsToInsert ),
		};
	}

	if ( ! Array.isArray( formatsToInsert ) ) {
		formatsToInsert = Array( textToInsert.length ).fill( [ formatsToInsert ] );
	}

	formats.splice( start, deleteCount, ...formatsToInsert );
	text = text.slice( 0, start ) + textToInsert + text.slice( start + deleteCount );

	return { formats, text };
}

export function getTextContent( { text, value } ) {
	return text || value.text;
}

export function applyFormat( { formats, text, value, selection }, format, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

		return {
			selection,
			value: applyFormat( value, format, start, end ),
		};
	}

	for ( let i = start; i < end; i++ ) {
		if ( formats[ i ] ) {
			const newFormats = formats[ i ].filter( ( { type } ) => type !== format.type );
			newFormats.push( format );
			formats[ i ] = newFormats;
		} else {
			formats[ i ] = [ format ];
		}
	}

	return { formats, text };
}

export function removeFormat( { formats, text, value, selection }, formatType, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

		return {
			selection,
			value: removeFormat( value, formatType, start, end ),
		};
	}

	for ( let i = start; i < end; i++ ) {
		if ( formats[ i ] ) {
			const newFormats = formats[ i ].filter( ( { type } ) => type !== formatType );
			formats[ i ] = newFormats.length ? newFormats : undefined;
		}
	}

	return { formats, text };
}

export function getActiveFormat( { value, selection }, formatType ) {
	if ( ! selection ) {
		return false;
	}

	if ( Array.isArray( value ) ) {
		return getActiveFormat( {
			value: value[ selection.start[ 0 ] ],
			selection: selection.start[ 1 ],
		} );
	}

	const formats = value.formats[ selection.start ];

	return find( formats, { type: formatType } );
}

export function split( { text, formats, selection, value }, start, end ) {
	if ( value !== undefined ) {
		start = start || selection.start;
		end = end || selection.end;

		const [ startValue, endValue ] = split( value, start, end );

		return [
			{
				selection: {},
				value: startValue,
			},
			{
				selection: {
					start: 0,
					end: 0,
				},
				value: endValue,
			},
		];
	}

	return [
		{
			formats: formats.slice( 0, start ),
			text: text.slice( 0, start ),
		},
		{
			formats: formats.slice( end ),
			text: text.slice( end ),
		},
	];
}
