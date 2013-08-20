var opacityOption = document.querySelector( '#option-opacity' ),
	modifierOption = document.querySelector( '#option-modifier' ),
	paddingOption = document.querySelector( '#option-padding' );

var statusElement = document.querySelector( '#status' );

var opacityValue,
	modifierValue,
	paddingValue;

opacityOption.addEventListener( 'change', function() {
	opacityValue = opacityOption.value;
	save();
}, false );

modifierOption.addEventListener( 'change', function() {
	modifierValue = modifierOption.value;
	save();
}, false );

paddingOption.addEventListener( 'change', function() {
	paddingValue = paddingOption.value;
	save();
}, false );

function load() {
	chrome.storage.sync.get(
		[
			'fokusOpacity',
			'fokusModifier',
			'fokusPadding'
		],
		function( options ) {
			opacityValue = options['fokusOpacity'];
			modifierValue = options['fokusModifier'];
			paddingValue = options['fokusPadding'];

			if( opacityValue ) {
				opacityOption.value = opacityValue;
			}

			if( modifierValue ) {
				modifierOption.value = modifierValue;
			}

			if( paddingValue ) {
				paddingOption.value = paddingValue;
			}
		}
	);
}

function save() {
	chrome.storage.sync.set(
		{
			'fokusOpacity': opacityValue,
			'fokusModifier': modifierValue,
			'fokusPadding': paddingValue
		},
		function() {
			flashStatus();
		}
	);
}

function flashStatus() {
	statusElement.style.WebkitTransition = '';
	statusElement.style.opacity = 1;

	setTimeout( function() {
		statusElement.style.WebkitTransition = 'opacity 2s ease-in';
		statusElement.style.opacity = 0;
	}, 1 );
}

load();

