# Block Compare

Shows the HTML and rendered difference between two blocks, side-by-side, along with buttons to pick the first or second block.

#### Props

##### block

The original object to compare against

- Type: `Object`
- Required: Yes

##### convertor

A function that returns a new object after some additional processing

- Type: `func`
- Required: Yes

##### onKeep

Callback when the original block is required

- Type: `func`
- Required: Yes

##### onConvert

Callback when the converted block is required.

- Type: `func`
- Required: Yes

##### convertorText

Text to show in the convert button

- Type: `string`
- Required: Yes
