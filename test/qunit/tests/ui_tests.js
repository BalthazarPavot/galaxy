/* global define, QUnit, module, test, ok, equal, deepEqual, notEqual */
define([ 'test-app', 'mvc/ui/ui-misc', 'mvc/ui/ui-select-content', 'mvc/ui/ui-drilldown'
], function( testApp, Ui, SelectContent, Drilldown ){
    'use strict';
    module( 'Ui test', {
        setup: function() {
            testApp.create();
        },
        teardown: function() {
            testApp.destroy();
        }
    } );

    test( 'options', function() {
        function _test( obj, options ) {
            ok( JSON.stringify( obj.value() ) == JSON.stringify( options.value ), 'Selected value is ' + options.value );
            ok( obj.$menu.css( 'display' ) == ( options.menu_visible ? 'block' : 'none' ), 'Menu visibility: ' + options.menu_visible );
            ok( obj.$message.css( 'display' ) == ( options.message_visible ? 'block' : 'none' ), 'Message visibility: ' + options.message_visible );
            ok( obj.$options.css( 'display' ) == ( options.options_visible ? 'inline-block' : 'none' ), 'Options visibility: ' + options.options_visible );
            options.message_cls && ok( obj.$message.hasClass( options.message_cls ), 'Message has class: ' + options.message_cls );
            ok( obj.length() === options.length, 'Number of options: ' + options.length );
            options.message_text && ok( obj.$message.html() === options.message_text, 'Message text is: ' + options.message_text );
            options.first && ok( obj.first() === options.first, 'First value is: ' + options.first );
            options.all_icon && ok( obj.all_button.$( '.icon' ).hasClass( options.all_icon ), 'All button in correct state: ' + options.all_icon );
            ok( obj.$menu.find( '.ui-button-check' ).length === ( Boolean( options.all_icon ) ? 1 : 0 ), 'All button available: ' + Boolean( options.all_active ) );
        }

        var radio = new Ui.Radio.View({});
        $( 'body' ).prepend( radio.$el );
        radio.model.set( 'visible', false );
        ok( radio.value() === null, 'Initial value is `null`.' );
        ok( radio.$el.css( 'display' ) === 'none', 'Options hidden.' );
        radio.model.set( 'visible', true );
        ok( radio.$el.css( 'display' ) === 'block', 'Options shown.' );
        radio.model.set( 'value', 'Unavailable.' );
        ok( radio.value() === null, 'Unavailable value ignored.' );
        _test( radio, {
            menu_visible: false,
            message_visible: true,
            message_text: 'No options available.',
            message_cls: 'alert-danger',
            options_visible: false,
            value: null,
            length: 0
        });
        radio.model.set( 'wait', true );
        _test( radio, {
            menu_visible: false,
            message_visible: true,
            message_text: 'Please wait...',
            message_cls: 'alert-info',
            options_visible: false,
            value: null,
            length: 0
        });
        radio.model.set( 'wait', false );
        _test( radio, {
            menu_visible: false,
            message_visible: true,
            message_text: 'No options available.',
            message_cls: 'alert-danger',
            options_visible: false,
            value: null,
            length: 0
        });
        radio.model.set( 'data', [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' } ] );
        _test( radio, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valuea',
            first: 'valuea',
            length: 2
        });
        radio.model.set( 'value', 'valueb' );
        _test( radio, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valueb',
            first: 'valuea',
            length: 2
        });
        radio.model.set( 'data', null );
        _test( radio, {
            menu_visible: false,
            message_visible: true,
            message_text: 'No options available.',
            message_cls: 'alert-danger',
            options_visible: false,
            value: null,
            first: null,
            length: 0
        });
        radio.model.set( 'data', [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' }, { value: 'valuec', label: 'labelc' } ] );
        _test( radio, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valueb',
            first: 'valuea',
            length: 3
        });
        radio.$( 'input' ).last().click();
        _test( radio, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valuec',
            first: 'valuea',
            length: 3
        });

        var check = new Ui.Checkbox.View({});
        $( 'body' ).prepend( check.$el );
        _test( check, {
            menu_visible: false,
            message_visible: true,
            message_text: 'No options available.',
            message_cls: 'alert-danger',
            options_visible: false,
            value: null,
            length: 0,
            all_icon: 'fa-square-o'
        });
        check.model.set( 'data', [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' }, { value: 'valuec', label: 'labelc' } ] );
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: null,
            length: 3,
            all_icon: 'fa-square-o'
        });
        check.model.set( 'value', [ 'valuea', 'valuec' ] );
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuea', 'valuec' ],
            length: 3,
            all_icon: 'fa-minus-square-o'
        });
        check.model.set( 'value', [ 'valuea', 'valueb', 'valuec' ] );
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuea', 'valueb', 'valuec' ],
            length: 3,
            all_icon: 'fa-check-square-o'
        });
        check.model.set( 'data', [] );
        _test( check, {
            menu_visible: false,
            message_visible: true,
            options_visible: false,
            value: null,
            length: 0,
            all_icon: 'fa-square-o'
        });
        check.model.set( 'data', [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' } ] );
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuea', 'valueb' ],
            first: 'valuea',
            length: 2,
            all_icon: 'fa-check-square-o'
        });
        check.all_button.$el.click();
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: null,
            first: 'valuea',
            length: 2,
            all_icon: 'fa-square-o'
        });
        check.all_button.$el.click();
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuea', 'valueb' ],
            first: 'valuea',
            length: 2,
            all_icon: 'fa-check-square-o'
        });
        check.$( 'input' ).last().click();
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuea' ],
            first: 'valuea',
            length: 2,
            all_icon: 'fa-minus-square-o'
        });
        check.$( 'input' ).last().click();
        _test( check, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuea', 'valueb' ],
            first: 'valuea',
            length: 2,
            all_icon: 'fa-check-square-o'
        });

        var radiobutton = new Ui.RadioButton.View({});
        $( 'body' ).prepend( radiobutton.$el );
        radiobutton.model.set( 'data', [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' } ] );
        _test( radiobutton, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valuea',
            first: 'valuea',
            length: 2
        });
        radiobutton.$( 'input' ).last().click();
        _test( radiobutton, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valueb',
            first: 'valuea',
            length: 2
        });

        var drilldown = new Drilldown.View({});
        $( 'body' ).prepend( drilldown.$el );
        drilldown.model.set( 'data', [ { value: 'valuea', name: 'labela', options: [
                                            { value: 'valueb', name: 'labelb' },
                                            { value: 'valuec', name: 'labelc' },
                                            { value: 'valued', name: 'labeld', options: [
                                                { value: 'valuee', name: 'labele' },
                                                { value: 'valuef', name: 'labelf' } ] } ] },
                                       { value: 'valueg', name: 'labelg', options: [
                                            { value: 'valueh', name: 'labelh' },
                                            { value: 'valuei', name: 'labeli' },
                                            { value: 'valuej', name: 'labelj', options: [
                                                { value: 'valuek', name: 'labelk' },
                                                { value: 'valuel', name: 'labell' },
                                                { value: 'valuem', name: 'labelm' } ] } ] },
                                       { value: 'valuen', name: 'labeln' } ] );
        _test( drilldown, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: null,
            first: 'valuea',
            length: 14,
            all_icon: 'fa-square-o'
        });
        drilldown.model.set( 'value', [ 'valuek', 'valuen' ] );
        _test( drilldown, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: [ 'valuek', 'valuen' ],
            first: 'valuea',
            length: 14,
            all_icon: 'fa-minus-square-o'
        });
        var drillradio = new Drilldown.View( { display: 'radio' } );
        $( 'body' ).prepend( drillradio.$el );
        _test( drillradio, {
            menu_visible: false,
            message_visible: true,
            options_visible: false,
            value: null,
            length: 0
        });
        drillradio.model.set( 'data', drilldown.model.get( 'data' ) );
        _test( drillradio, {
            menu_visible: true,
            message_visible: false,
            options_visible: true,
            value: 'valuea',
            first: 'valuea',
            length: 14
        });
    });

    test( 'select-default', function() {
        function _test( options ) {
            ok( JSON.stringify( select.value() ) == JSON.stringify( options.value ), 'Selected value is ' + options.value );
            ok( select.text() == options.label, 'Selected label is ' + options.label );
            ok( select.$el.display === options.visible ? 'block' : 'none', options.visible ? 'Visible' : 'Hidden' );
            ok( select.$select.find( 'option' ).length === options.count && select.length(), 'Found ' + options.count + ' option' );
            options.exists && ok( select.$select.find( 'option[value="' + options.exists + '"]' ).length === 1, 'Found value: ' + options.exists );
            ok( select.$select.prop( 'multiple' ) === Boolean( options.multiple ), 'Multiple state set to: ' + options.multiple );
            ok( Boolean( select.all_button ) === Boolean( options.multiple ), 'Visiblity of select all button correct.' );
            options.multiple && ok( select.all_button.$( '.icon' ).hasClass( options.all_icon ), 'All button in correct state: ' + options.all_icon );
        }
        var select = new Ui.Select.View({});
        $( 'body' ).prepend( select.$el );
        ok( select.first() === '__null__', 'First select is \'__null__\'' );
        ok( select.$dropdown.hasClass( 'fa-caret-down' ), 'Caret down shown.' );
        select.model.set( 'data', [ { value: 'value', label: 'label' } ] );
        _test({
            value   : 'value',
            label   : 'label',
            visible : true,
            count   : 1
        });
        select.model.set( 'data', [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' } ] );
        _test({
            value   : 'valuea',
            label   : 'labela',
            visible : true,
            count   : 2,
            exists  : 'valueb'
        });
        select.value( 'valueb' );
        _test({
            value   : 'valueb',
            label   : 'labelb',
            visible : true,
            count   : 2
        });
        select.model.set( 'data', [ { value: 'value', label: 'label' } ] );
        _test({
            value   : 'value',
            label   : 'label',
            visible : true,
            count   : 1
        });
        select.model.set( { visible: false, value: 'unavailable' } );
        _test({
            value   : 'value',
            label   : 'label',
            visible : false,
            count   : 1
        });
        select.model.set( { visible: true, value: 'valueb', data: [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' } ] } );
        _test({
            value   : 'valueb',
            label   : 'labelb',
            visible : true,
            count   : 2,
            exists  : 'valuea'
        });
        select.model.set( { multiple: true } );
        _test({
            value   : [ 'valueb' ],
            label   : 'labelb',
            visible : true,
            count   : 2,
            exists  : 'valuea',
            multiple: true,
            all_icon: 'fa-minus-square-o'
        });
        select.model.set( 'value', [ 'valuea', 'valueb' ] );
        _test({
            value   : [ 'valuea', 'valueb' ],
            label   : 'labela',
            visible : true,
            count   : 2,
            exists  : 'valueb',
            multiple: true,
            all_icon: 'fa-check-square-o'
        });
        select.model.set( 'value', [] );
        _test({
            value   : null,
            label   : '',
            visible : true,
            count   : 2,
            exists  : 'valuea',
            multiple: true,
            all_icon: 'fa-square-o'
        });
        select.model.set( { multiple: false } );
        _test({
            value   : 'valuea',
            label   : 'labela',
            visible : true,
            count   : 2,
            exists  : 'valuea'
        });
        select.model.set( { visible: false } );
        _test({
            value   : 'valuea',
            label   : 'labela',
            visible : false,
            count   : 2,
            exists  : 'valuea'
        });
        select.model.set( { multiple: true, visible: true, value: [ 'valueb', 'valuec' ],  data: [ { value: 'valuea', label: 'labela' }, { value: 'valueb', label: 'labelb' }, { value: 'valuec', label: 'labelc' } ] } );
        _test({
            value   : [ 'valueb', 'valuec' ],
            label   : 'labelb',
            visible : true,
            count   : 3,
            exists  : 'valuea',
            multiple: true,
            all_icon: 'fa-minus-square-o'
        });
    } );

    test( 'label', function() {
        var label = new Ui.Label({
            title   : '_title'
        });
        $( 'body' ).prepend( label.$el );
        ok( label.$el.html() === '_title', 'Correct title' );
        label.model.set( 'title', '_new_title' );
        ok( label.$el.html() === '_new_title', 'Correct new title' );
    } );

    test( 'input', function() {
        var input = new Ui.Input();
        $( 'body' ).prepend( input.$el );
        ok( input.tagName === 'input', 'Created input.' );
        ok( input.value() === undefined, 'Input empty.' );
        input.model.set( 'value', '_value' );
        ok( input.$el.val() === '_value', 'Input with value.' );
        ok( !input.$el.hasClass( '_cls' ), 'Has no custom class.' );
        input.model.set( 'cls', '_cls' );
        ok( input.$el.hasClass( '_cls' ), 'Has custom class.' );
        ok( !input.$el.attr( 'placeholder' ), 'Has no placeholder' );
        input.model.set( 'placeholder', '_placeholder' );
        ok( input.$el.attr( 'placeholder' ) === '_placeholder', 'Has correct placeholder' );
        input.model.set( 'disabled', true );
        ok( input.$el.attr( 'disabled' ), 'Disabled' );
        input.model.set( 'disabled', false );
        ok( !input.$el.attr( 'disabled' ), 'Enabled' );
        input.model.set( 'visible', false );
        ok( input.$el.css( 'display' ) === 'none', 'Hidden' );
        input.model.set( 'visible', true );
        ok( input.$el.css( 'display' ) === 'inline-block', 'Shown' );
    } );

    test( 'textarea', function() {
        var input = new Ui.Input( { area: true } );
        $( 'body' ).prepend( input.$el );
        ok( input.tagName === 'textarea', 'Created textarea.' );
        ok( input.value() === undefined, 'Unavailable value.' );
        input.model.set( 'value', '_value' );
        ok( input.value() === '_value', 'Correct new value.' );
        ok( !input.$el.hasClass( '_cls' ), 'Has no custom class.' );
        input.model.set( 'cls', '_cls' );
        ok( input.$el.hasClass( '_cls' ), 'Has custom class.' );
    } );

    test( 'message', function() {
        var message = new Ui.Message({
            persistent  : true,
            message     : '_message',
            status      : 'danger'
        });
        $( 'body' ).prepend( message.$el );
        ok( message.$el.hasClass( 'alert-danger' ), 'Alert danger.' );
        message.model.set( 'status', 'info' );
        ok( !message.$el.hasClass( 'alert-danger' ), 'Alert danger (disabled).' );
        ok( message.$el.hasClass( 'alert-info' ), 'Alert info.' );
        ok( message.$el.html() === '_message', 'Correct message.' );
        message.model.set( 'message', '_new_message' );
        ok( message.$el.html() === '_new_message', 'Correct new message.' );
    } );

    test( 'hidden', function() {
        var hidden = new Ui.Hidden();
        $( 'body' ).prepend( hidden.$el );
        hidden.model.set( 'info', '_info' );
        ok( hidden.$info.css( 'display', 'block' ), 'Info shown.' );
        ok( hidden.$info.html() === '_info', 'Info text correct.' );
        hidden.model.set( 'info', '' );
        ok( hidden.$info.css( 'display', 'none' ), 'Info hidden.' );
        hidden.model.set( 'value', '_value' );
        ok( hidden.$hidden.val() === '_value', 'Correct value' );
    } );

    test( 'select-content', function() {
        var select = new SelectContent.View({});
        $( 'body' ).prepend( select.$el );
        var _testSelect = function( tag, options ) {
            var $select = select.$( '.ui-select:' + tag );
            var $option = $select.find( 'option:first' );
            var $button = select.$( '.ui-radiobutton' ).find( 'label:' + tag );
            ok ( $select.find( 'option' ).length == options[ tag + 'length' ], tag + ' one has ' + options[ tag + 'length' ] + ' options' );
            ok ( $option.prop( 'value' ) == options[ tag + 'value' ], tag + ' option has correct value' );
            ok ( $option.text() == options[ tag + 'label' ], tag + ' option has correct label' );
            ok ( $select.hasClass( 'ui-select-multiple' ) == options[ tag + 'multiple' ], 'Check multiple option' );
            $button.trigger( 'mouseover' );
            var tooltip = $( '.tooltip-inner:last' ).text();
            $button.trigger( 'mouseleave' );
            ok( tooltip.indexOf( 'dataset' ) != -1 || tooltip.indexOf( 'collection' ) != -1, 'Basic tooltip check' );
        };
        var _test = function( options ) {
            ok ( select.button_type.$( '.ui-option:first' ).hasClass( 'active' ), 'First one is toggled' );
            ok ( select.$( '.ui-select' ).length == options.selectfields, 'Found ' + options.selectfields + ' select fields' );
            ok ( select.button_type.$( '.ui-option' ).length == options.selectfields, 'Found ' + options.selectfields + ' radio button options' );
            ok ( select.$( '.ui-select-multiple' ).length == options.totalmultiple, 'Contains ' + options.totalmultiple + ' multiselect fields' );
            ok ( select.$( '.ui-radiobutton' ).length === ( options.selectfields > 1 ? 1 : 0 ), 'Radio button visibility' );
            ok ( select.$( '.ui-select:first' ).css( 'display' ) == 'block', 'Check select visibility' );
            ok ( select.$( '.ui-select:last' ).css( 'display' ) == ( options.selectfields == 1 ? 'block' : 'none' ), 'Last select visibility' );
            _testSelect( 'first', options );
            _testSelect( 'last', options );
        };

        ok ( select.button_type.value() == 0, 'Initial mode selected by default.' );
        select.model.set( 'data', { 'hda':  [{ id: 'id0', name: 'name0', hid: 'hid0' },
                                             { id: 'id1', name: 'name1', hid: 'hid1' }],
                                    'hdca': [{ id: 'id2', name: 'name2', hid: 'hid2' },
                                             { id: 'id3', name: 'name3', hid: 'hid3' },
                                             { id: 'id4', name: 'name4', hid: 'hid4' }] } );

        var initial = { selectfields    : 3,
                        firstlength     : 2,
                        firstvalue      : 'id0',
                        firstlabel      : 'hid0: name0',
                        firstmultiple   : false,
                        totalmultiple   : 1,
                        lastvalue       : 'id2',
                        lastlabel       : 'hid2: name2',
                        lastlength      : 3,
                        lastmultiple    : false };
        _test( initial );

        select.model.set( 'multiple', true );
        select.model.set( 'type', 'data' );
        _test({ selectfields    : 2,
                firstlength     : 2,
                firstvalue      : 'id0',
                firstlabel      : 'hid0: name0',
                firstmultiple   : true,
                totalmultiple   : 1,
                lastvalue       : 'id2',
                lastlabel       : 'hid2: name2',
                lastlength      : 3,
                lastmultiple    : false });

        select.model.set( 'multiple', false );
        select.model.set( 'type', 'data_collection' );
        _test({ selectfields    : 1,
                firstlength     : 3,
                firstvalue      : 'id2',
                firstlabel      : 'hid2: name2',
                firstmultiple   : false,
                totalmultiple   : 0,
                lastvalue       : 'id2',
                lastlabel       : 'hid2: name2',
                lastlength      : 3,
                lastmultiple    : false });

        select.model.set( 'type', 'workflow_collection' );
        _test({ selectfields    : 2,
                firstlength     : 3,
                firstvalue      : 'id2',
                firstlabel      : 'hid2: name2',
                firstmultiple   : false,
                totalmultiple   : 1,
                lastvalue       : 'id2',
                lastlabel       : 'hid2: name2',
                lastlength      : 3,
                lastmultiple    : true });

        select.model.set( 'type', 'workflow_data' );
        _test({ selectfields    : 2,
                firstlength     : 2,
                firstvalue      : 'id0',
                firstlabel      : 'hid0: name0',
                firstmultiple   : false,
                totalmultiple   : 1,
                lastvalue       : 'id0',
                lastlabel       : 'hid0: name0',
                lastlength      : 2,
                lastmultiple    : true });

        select.model.set( 'type', 'data' );
        _test( initial );

        select.model.set( 'wait', true );
        ok ( select.$( '.icon-dropdown' ).hasClass( 'fa-spinner' ), 'Shows spinner' );
        select.model.set( 'wait', false );
        ok ( select.$( '.icon-dropdown' ).hasClass( 'fa-caret-down' ), 'Shows caret' );
        select.model.set( 'optional', true );
        ok ( select.$( 'option:first' ).prop( 'value' ) == '__null__', 'First option is optional value' );
        select.model.set( 'optional', false );
        ok ( select.$( 'option:first' ).prop( 'value' ) != '__null__', 'First option is not optional value' );

        select.model.set( 'value', { values: [ { id: 'id1', src: 'hda' } ] } );
        ok( JSON.stringify( select.value() ) == '{"batch":false,"values":[{"id":"id1","name":"name1","hid":"hid1"}]}', 'Checking single value' );
        ok( select.config[ select.model.get( 'current' ) ].src == 'hda', 'Matched dataset field' );
        ok( !select.config[ select.model.get( 'current' ) ].multiple, 'Matched single select field' );
        select.model.set( 'value', { values: [ { id: 'id0', src: 'hda' }, { id: 'id1', src: 'hda' } ] } );
        ok( select.config[ select.model.get( 'current' ) ].multiple, 'Matched multiple field' );
        ok( JSON.stringify( select.value() ) == '{"batch":true,"values":[{"id":"id0","name":"name0","hid":"hid0"},{"id":"id1","name":"name1","hid":"hid1"}]}', 'Checking multiple values' );
        select.model.set( 'value', { values: [ { id: 'id2', src: 'hdca' } ] } );
        ok( select.config[ select.model.get( 'current' ) ].src == 'hdca', 'Matched collection field' );
        ok( JSON.stringify( select.value() ) == '{"batch":true,"values":[{"id":"id2","name":"name2","hid":"hid2"}]}', 'Checking collection value' );

        select = new SelectContent.View({});
        $( 'body' ).prepend( select.$el );
        var _testEmptySelect = function( tag, txt_extension, txt_label ) {
            var $select = select.$( '.ui-select:' + tag );
            var $option = $select.find( 'option:first' );
            ok ( $option.prop( 'value' ) == '__null__', tag + ' option has correct empty value.' );
            ok ( $option.text() == 'No ' + txt_extension + txt_label + ' available.', tag + ' option has correct empty label.' );
        };

        var labels = select.model.get( 'src_labels' );
        _testEmptySelect( 'first', '', labels.hda );
        _testEmptySelect( 'last', '', labels.hdca );
        select.model.set( 'extensions', [ 'txt', 'bam' ] );
        _testEmptySelect( 'first', 'txt or bam ', labels.hda );
        _testEmptySelect( 'last', 'txt or bam ', labels.hdca );
        select.model.set( 'extensions', [ 'txt' ] );
        _testEmptySelect( 'first', 'txt ', labels.hda );
        _testEmptySelect( 'last', 'txt ', labels.hdca );
    } );
});