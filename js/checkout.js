(function($) {
  __slice = [].slice,
    __indexOf = [].indexOf || function(item) {
      for (var i = 0, l = this.length; i < l; i++) {
        if (i in this && this[i] === item) return i;
      }
      return -1;
    };
  $.fn.checkout = function(opts) {

    // Config plugin
    var set = $.extend({
      inputs: [],
      submit: {},
      commerce : {}
    }, opts);

    // Set plugin's default data
    var defaultFormat = /(\d{1,4})/g;
    var cards = [{
      type: 'visa',
      patterns: [4],
      format: defaultFormat,
      length: [13, 16],
      cvcLength: [3],
      luhn: true,
      adquirer: "vdp"
    }, {
      type: 'mastercard',
      patterns: [51, 52, 53, 54, 55, 22, 23, 24, 25, 26, 27],
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true,
      adquirer: "pmc"
    }, {
      type: 'amex',
      patterns: [34, 37],
      format: /(\d{1,4})(\d{1,6})?(\d{1,5})?/,
      length: [15],
      cvcLength: [3, 4],
      luhn: true,
      adquirer: "pmc"
    }, {
      type: 'dinners',
      patterns: [30, 36, 38, 39],
      format: /(\d{1,4})(\d{1,6})?(\d{1,4})?/,
      length: [14],
      cvcLength: [3],
      luhn: true,
      adquirer: "pmc"
    }, {
      type: 'discover',
      patterns: [60, 64, 65, 622],
      format: defaultFormat,
      length: [16],
      cvcLength: [3],
      luhn: true,
      adquirer: "pmc"
    }];
    var currentCard = {
      type: "",
      data: {},
      validate:{
        "card":false,
        "exp":false,
        "cvc":false,
        "email":false
      }
    }
    var bt = {
      inputTypes: {
        card: {},
        exp: {},
        cvc: {},
        email: {},
        text: {}
      },
      compState: {
        success: "has-success",
        failed: "has-error",
        disabled: "has-disabled",
        start: "has-start"
      }
    }
    var registeredInputs = [];
    var registerSubmit = false;

    // Module : DOM Manipulation
    var domManipulation = {
      changeState: function($comp, $state) {
        $jcomp = $comp.jobj;

        $.each(bt.compState, function(i, e) {
          $jcomp.removeClass(e);
          $jcomp.parents(".form-group").removeClass(e);
        });

        switch ($comp.dom) {
          case 'input':
            switch ($state) {
              case bt.compState.success:
              case bt.compState.failed:
                $jcomp.removeClass("disabled").prop("disabled", false);
                break;
              case bt.compState.disabled:
                $jcomp.addClass("disabled").prop("disabled", true).val("");
                break;
              case bt.compState.start:
                $jcomp.removeClass("disabled").prop("disabled", false);
                break;
            }
            $jcomp.parents(".form-group").addClass($state);
          break;
          case 'button':
            switch ($state) {
              case bt.compState.disabled:
                $jcomp.addClass("disabled").prop("disabled", true);
                break;
              case bt.compState.start:
                $jcomp.removeClass("disabled").prop("disabled", false);
                break;
            }
          break;
        }
        $jcomp.addClass($state);
      },

      manageCompDependencies : function(validated){
        // Change states for dependenciesInputs
        var relInputs = [elementRequester.getByName('cvc'), elementRequester.getByName('exp')];
        for (var i = 0; i < relInputs.length; i++) {
          if (validated) {
            domManipulation.changeState(relInputs[i], bt.compState.start);
          } else {
            domManipulation.changeState(relInputs[i], bt.compState.disabled);
          }
        }

      }
    }
    // Module : Data validation
    var dataValidation = {
      luhnCheck: function(num) {
        var digit, digits, odd, sum, _i, _len;
        odd = true;
        sum = 0;
        digits = (num + '').split('').reverse();
        for (_i = 0, _len = digits.length; _i < _len; _i++) {
          digit = digits[_i];
          digit = parseInt(digit, 10);
          if ((odd = !odd)) {
            digit *= 2;
          }
          if (digit > 9) {
            digit -= 9;
          }
          sum += digit;
        }
        return sum % 10 === 0;
      },
      validateCardNumber: function(num) {
        var card, _ref;
        num = (num + '').replace(/\s+|-/g, '');
        if (!/^\d+$/.test(num)) {
          return false;
        }
        card = cardComponent.cardFromNumber(num);
        if (!card) {
          return false;
        }
        return (_ref = num.length, __indexOf.call(card.length, _ref) >= 0) && (card.luhn === false || dataValidation.luhnCheck(num));
      },
      validateCardCVC: function(cvc) {
        var long = false, valid = false;
        var card, _ref;
        cvc = $.trim(cvc);
        if (/^\d+$/.test(cvc)) {
          card = cardComponent.cardFromType(currentCard.type);

          if (card != null) {
            long = Math.max.apply(Math, card.cvcLength) >= cvc.length;
            valid = (_ref = cvc.length, __indexOf.call(card.cvcLength, _ref) >= 0);
          } else {
            long = cvc.length >= 3 && cvc.length <= 4;
          }
        }
        return {
          long: long,
          valid: valid
        }
      },
      validateCardExp: function(exp) {
        var long = false, valid = false;
        exp = exp.replace(/\D/g, '');
        if (exp.length < 7) {
          long = true;
          if (exp.length > 2) {
            var currentYear = parseInt(new Date().getFullYear());
            var inputYear = exp.substring(2);
            if( inputYear >= currentYear &&  inputYear <= (currentYear + 10)){
              valid = true;
            }
          }
        }
        return {
          long: long,
          valid: valid
        }
      },
      validateCardEmail: function(email) {
        var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        console.log( re.test(email) );
        return re.test(email);
      },
      processCardNumber: function(e, $input) {
        var $inputVal = $input.jobj.val();
        var state = false;
        var validated = false;
        if( $inputVal == "" ){
          state = bt.compState.start;
          cardComponent.cleanValidationFields();
        }
        if (state == false) {
          // Validate card number and set state
          validated = dataValidation.validateCardNumber($input.jobj.val());
          state = validated ? bt.compState.success : bt.compState.failed;
        }
        domManipulation.changeState($input, state);
        cardComponent.setCardType(e);
        domManipulation.manageCompDependencies(validated);

        cardComponent.setFieldValidation('card',{valid: validated,value:$input.jobj.val()});
        eventRequester.checkIfValidCard();
      },
      processCardCVC : function(e,$input){
        var validated = dataValidation.validateCardCVC($input.jobj.val()).valid;
        domManipulation.changeState($input, validated ? bt.compState.success : bt.compState.failed );

        cardComponent.setFieldValidation('cvc',{valid: validated,value:$input.jobj.val()});
        eventRequester.checkIfValidCard();
      },
      processCardExpiry : function(e,$input){
        var validated = dataValidation.validateCardExp($input.jobj.val()).valid;
        domManipulation.changeState($input, validated ? bt.compState.success : bt.compState.failed);

        cardComponent.setFieldValidation('exp',{valid: validated,value:$input.jobj.val()});
        eventRequester.checkIfValidCard();
      },
      processCardEmail : function(e,$input){
        var validated = dataValidation.validateCardEmail($input.jobj.val());
        domManipulation.changeState($input, validated ? bt.compState.success : bt.compState.failed);

        cardComponent.setFieldValidation('email',{valid: validated,value:$input.jobj.val()});
        eventRequester.checkIfValidCard();
      }
    }

    // Component : Card
    var cardComponent = {
      setFieldValidation : function(field,data){
        currentCard.validate[field] = data.valid;
        if(data.valid)
          cardComponent.setFieldData(field,data.value);
      },
      setFieldData : function(field,value){
        currentCard.data[field] = value;
      },
      gotValidCard : function(){
        var er = 0;
        $.each(currentCard.validate,function(i,e){
          if(e==false)
            er++;
        });
        return er == 0;
      },
      cleanValidationFields : function(){
        $.each(currentCard.validate,function(i,e){
          currentCard.validate[i] = false;
        });
      },
      setCardType: function(e) {
        var $target, allTypes, card, cardType, val;
        $target = $(e.currentTarget);
        val = $target.val();
        cardType = cardComponent.cardType(val) || 'unknown';
        if (!$target.hasClass(cardType)) {
          allTypes = (function() {
            var _i, _len, _results;
            _results = [];
            for (_i = 0, _len = cards.length; _i < _len; _i++) {
              card = cards[_i];
              _results.push(card.type);
            }
            return _results;
          })();
          $target.removeClass('unknown');
          $target.removeClass(allTypes.join(' '));
          $target.addClass(cardType);
          $target.toggleClass('identified', cardType !== 'unknown');
          currentCard.type = cardType;
        }
      },
      cardType: function(num) {
        var _ref;
        if (!num) {
          return null;
        }
        return ((_ref = cardComponent.cardFromNumber(num)) != null ? _ref.type : void 0) || null;
      },
      cardFromNumber: function(num) {
        var card, p, pattern, _i, _j, _len, _len1, _ref;
        num = (num + '').replace(/\D/g, '');
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
          card = cards[_i];
          _ref = card.patterns;
          for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
            pattern = _ref[_j];
            p = pattern + '';
            if (num.substr(0, p.length) === p) {
              return card;
            }
          }
        }
      },
      cardFromType: function(type) {
        var card, _i, _len;
        for (_i = 0, _len = cards.length; _i < _len; _i++) {
          card = cards[_i];
          if (card.type === type) {
            return card;
          }
        }
      }
    }

    // Elements : Card Number
    var numbHandling = {
      formatCardNumber: function(e) {
        var $target, card, digit, length, re, upperLength, value;
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
          return "";
        }
        $target = $(e.currentTarget);
        value = $target.val();
        card = cardComponent.cardFromNumber(value + digit);
        length = (value.replace(/\D/g, '') + digit).length;
        upperLength = 16;
        if (card) {
          upperLength = card.length[card.length.length - 1];
        }
        if (length >= upperLength) {
          return "";
        }
        if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
          return "";
        }
        if (card && card.type === 'amex') {
          re = /^(\d{4}|\d{4}\s\d{6})$/;
        } else {
          re = /(?:^|\s)(\d{4})$/;
        }
        if (re.test(value)) {
          e.preventDefault();
          return setTimeout(function() {
            return $target.val(value + ' ' + digit);
          });
        } else if (re.test(value + digit)) {
          e.preventDefault();
          return setTimeout(function() {
            return $target.val(value + digit + ' ');
          });
        }
      },
      reFormatCardNumber: function(e) {
        var $target;
        $target = $(e.currentTarget);
        return setTimeout(function() {
          var value;
          value = $target.val();
          value = eventRequester.replaceFullWidthChars(value);
          value = eventRequester.formatCardNumber(value);
          return eventRequester.safeVal(value, $target);
        });
      },
      restrictCardNumber: function(e) {
        var $target, card, digit, value;
        $target = $(e.currentTarget);
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
          return false;
        }
        if (eventRequester.hasTextSelected($target)) {
          return false;
        }
        value = ($target.val() + digit).replace(/\D/g, '');
        card = cardComponent.cardFromNumber(value);
        if (card) {
          return value.length <= card.length[card.length.length - 1];
        } else {
          return value.length <= 16;
        }
      }
    }
    // Elements : Card Cvc
    var cvcHandling = {
      restrictCVC: function(e, $input) {
        var $target, digit, val;
        $target = $(e.currentTarget);
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
          return false;
        }
        if (eventRequester.hasTextSelected($target)) {
          return false;
        }
        return dataValidation.validateCardCVC($target.val() + digit).long;
      },
      reFormatCVC: function(e) {
        var $target;
        $target = $(e.currentTarget);
        return setTimeout(function() {
          var value;
          value = $target.val();
          value = eventRequester.replaceFullWidthChars(value);
          value = value.replace(/\D/g, '').slice(0, 4);
          return eventRequester.safeVal(value, $target);
        });
      }
    }
    var emailHandling = {
      restrictEmail: function(e,$input) {
        var $target, digit, value;
        $target = $(e.currentTarget);
        key = String.fromCharCode(e.which);
        if (eventRequester.hasTextSelected($target)) {
          return false;
        }
        return dataValidation.validateCardEmail($target.val() + key);
      },
      reFormatEmail: function(e) {
        var $target;
        $target = $(e.currentTarget);
        return setTimeout(function() {
          return $target.val();
        });
      }
    }
    // Elements : Expiry
    var expHandling = {
      restrictExpiry: function(e,$input) {
        var $target, digit, value;
        $target = $(e.currentTarget);
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
          return false;
        }
        if (eventRequester.hasTextSelected($target)) {
          return false;
        }
        return dataValidation.validateCardExp($target.val() + digit).long;
      },
      reFormatExpiry: function(e) {
        var $target;
        $target = $(e.currentTarget);
        return setTimeout(function() {
          var value;
          value = $target.val();
          value = eventRequester.replaceFullWidthChars(value);
          value = eventRequester.formatExpiry(value);
          return eventRequester.safeVal(value, $target);
        });
      },
      formatExpiry: function(e) {
        var $target, digit, val;
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
          return;
        }
        $target = $(e.currentTarget);
        val = $target.val() + digit;

        if (/^\d$/.test(val) && (val !== '0' && val !== '1')) {
          e.preventDefault();
          return setTimeout(function() {
            return $target.val("0" + val + " / ");
          });
        } else if (/^\d\d$/.test(val)) {

          e.preventDefault();
          return setTimeout(function() {

            var m1, m2;
            m1 = parseInt(val[0], 10);
            m2 = parseInt(val[1], 10);
            if (m2 > 2 && m1 !== 0) {
              return $target.val("0" + m1 + " / " + m2);
            } else {
              return $target.val("" + val + " / ");
            }
          });
        }
      },
      formatForwardExpiry: function(e) {
        var $target, digit, val;
        digit = String.fromCharCode(e.which);
        if (!/^\d+$/.test(digit)) {
          return;
        }
        $target = $(e.currentTarget);
        val = $target.val();
        if (/^\d\d$/.test(val)) {
          return $target.val("" + val + " / ");
        }
      },
      formatForwardSlashAndSpace: function(e) {
        var $target, val, which;
        which = String.fromCharCode(e.which);
        if (!(which === '/' || which === ' ')) {
          return;
        }
        $target = $(e.currentTarget);
        val = $target.val();
        if (/^\d$/.test(val) && val !== '0') {
          return $target.val("0" + val + " / ");
        }
      },
      formatBackExpiry: function(e) {
        var $target, value;
        $target = $(e.currentTarget);
        value = $target.val();
        if (e.which !== 8) {
          return;
        }
        if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== value.length) {
          return;
        }
        if (/\d\s\/\s$/.test(value)) {
          e.preventDefault();
          return setTimeout(function() {
            return $target.val(value.replace(/\d\s\/\s$/, ''));
          });
        }
      },
      getDate: function(index){
        return $.trim(currentCard.data.exp.split("/")[index]);
      }
    }

    // Interface : Transport
    var transport = {
      commerce:{
        key:"",
        api:"https://api.culqi.com/v2/tokens"
      },
      tokenize : function (){

        var data = {
          "first_name": "Erlich",
          "last_name": "Bachman",
          "email": currentCard.data.email,
          "currency": transport.commerce.currency,
          "card_number": currentCard.data.card,
          "cvv": currentCard.data.cvc,
          "expiration_month": expHandling.getDate(0),
          "expiration_year": expHandling.getDate(1),
          "fingerprint": "MiDispositivo123465"
        }

        alert("Data to send: "+ JSON.stringify(data));

        return false;

        var xhr = $.ajax({
            type: "POST",
            url: transport.commerce.api,
            beforeSend: function (request) {
                request.setRequestHeader('Authorization', transport.commerce.key);
            }
        });
        xhr.done(function (svr) {

        }).fail(function (xhr, status, text) {
            if (xhr.readyState != 0)
                alert(' readyState: ' + xhr.readyState + ' responseText: ' + xhr.responseText);
        }).always(function () {

        });
      }
    }

    // Interface : Element Requester
    var elementRequester = {
      getByName: function(name) {
        return registeredInputs.filter(function(a) {
          return (a.type == name) ? a : false
        })[0];
      }
    }
    // Interface : Events Requester
    var eventRequester = {
      numbChanged: {
        onInput: function(e, $input) {
          cardComponent.setCardType(e);
          return numbHandling.reFormatCardNumber(e);
        },
        onPaste: function(e, $input) {
          return numbHandling.reFormatCardNumber(e);
        },
        onChange: function(e, $input) {
          return numbHandling.reFormatCardNumber(e);
        },
        onKeypress: function(e, $input) {
          numbHandling.formatCardNumber(e);
          return numbHandling.restrictCardNumber(e) && eventRequester.restrictNumeric(e);
        },
        onKeyup: function(e, $input) {
          dataValidation.processCardNumber(e, $input);
        }
      },
      cvcChanged: {
        onInput: function(e, $input) {
          return cvcHandling.reFormatCVC(e);
        },
        onPaste: function(e, $input) {
          return cvcHandling.reFormatCVC(e);
        },
        onChange: function(e, $input) {
          return cvcHandling.reFormatCVC(e);
        },
        onKeypress: function(e, $input) {
          return cvcHandling.restrictCVC(e, $input) && eventRequester.restrictNumeric(e);
        },
        onKeyup: function(e, $input) {
          dataValidation.processCardCVC(e, $input);
        }
      },
      expChanged: {
        onInput: function(e, $input) {
          return expHandling.reFormatExpiry(e);
        },
        onPaste: function(e, $input) {
          return expHandling.reFormatExpiry(e);
        },
        onChange: function(e, $input) {
          return expHandling.reFormatExpiry(e);
        },
        onKeypress: function(e, $input) {
          expHandling.formatExpiry(e);
          expHandling.formatForwardSlashAndSpace(e);
          expHandling.formatForwardExpiry(e);
          return expHandling.restrictExpiry(e, $input) && eventRequester.restrictNumeric(e);
        },
        onKeydown: function(e, $input) {
          return expHandling.formatBackExpiry(e, $input);
        },
        onKeyup: function(e, $input) {
          dataValidation.processCardExpiry(e, $input);
        }
      },
      emailChanged: {
        onInput: function(e, $input) {
          emailHandling.reFormatEmail(e);
        },
        onPaste: function(e, $input) {
          emailHandling.reFormatEmail(e);
        },
        onChange: function(e, $input) {
          emailHandling.reFormatEmail(e);
        },
        onKeypress: function(e, $input) {
          emailHandling.restrictEmail(e, $input);
        },
        onKeyup: function(e, $input) {
          dataValidation.processCardEmail(e, $input);
        }
      },
      cardReady: {
        onSubmit: function(e, $input){
          if(cardComponent.gotValidCard()){
            transport.tokenize();
          }
        }
      },
      hasTextSelected: function($target) {
        var _ref;
        if (($target.prop('selectionStart') != null) && $target.prop('selectionStart') !== $target.prop('selectionEnd')) {
          return true;
        }
        if ((typeof document !== "undefined" && document !== null ? (_ref = document.selection) != null ? _ref.createRange : void 0 : void 0) != null) {
          if (document.selection.createRange().text) {
            return true;
          }
        }
        return false;
      },
      restrictNumeric: function(e) {
        var input;
        if (e.metaKey || e.ctrlKey) {
          return true;
        }
        if (e.which === 32) {
          return false;
        }
        if (e.which === 0) {
          return true;
        }
        if (e.which < 33) {
          return true;
        }
        input = String.fromCharCode(e.which);
        return !!/[\d\s]/.test(input);
      },
      replaceFullWidthChars: function(str) {
        var chars, chr, fullWidth, halfWidth, idx, value, _i, _len;
        if (str == null) {
          str = '';
        }
        fullWidth = '\uff10\uff11\uff12\uff13\uff14\uff15\uff16\uff17\uff18\uff19';
        halfWidth = '0123456789';
        value = '';
        chars = str.split('');
        for (_i = 0, _len = chars.length; _i < _len; _i++) {
          chr = chars[_i];
          idx = fullWidth.indexOf(chr);
          if (idx > -1) {
            chr = halfWidth[idx];
          }
          value += chr;
        }
        return value;
      },
      safeVal: function(value, $target) {
        var currPair, cursor, digit, error, last, prevPair;
        try {
          cursor = $target.prop('selectionStart');
        } catch (_error) {
          error = _error;
          cursor = null;
        }
        last = $target.val();
        $target.val(value);
        if (cursor !== null && $target.is(":focus")) {
          if (cursor === last.length) {
            cursor = value.length;
          }
          if (last !== value) {
            prevPair = last.slice(cursor - 1, +cursor + 1 || 9e9);
            currPair = value.slice(cursor - 1, +cursor + 1 || 9e9);
            digit = value[cursor];
            if (/\d/.test(digit) && prevPair === ("" + digit + " ") && currPair === (" " + digit)) {
              cursor = cursor + 1;
            }
          }
          $target.prop('selectionStart', cursor);
          return $target.prop('selectionEnd', cursor);
        }
      },
      formatCardNumber: function(num) {
        var card, groups, upperLength, _ref;
        num = num.replace(/\D/g, '');
        card = cardComponent.cardFromNumber(num);
        if (!card) {
          return num;
        }
        upperLength = card.length[card.length.length - 1];
        num = num.slice(0, upperLength);
        if (card.format.global) {
          return (_ref = num.match(card.format)) != null ? _ref.join(' ') : void 0;
        } else {
          groups = card.format.exec(num);
          if (groups == null) {
            return;
          }
          groups.shift();
          groups = $.grep(groups, function(n) {
            return n;
          });
          return groups.join(' ');
        }
      },
      formatExpiry: function(expiry) {
        var mon, parts, sep, year;
        parts = expiry.match(/^\D*(\d{1,2})(\D+)?(\d{1,4})?/);
        if (!parts) {
          return '';
        }
        mon = parts[1] || '';
        sep = parts[2] || '';
        year = parts[3] || '';
        if (year.length > 0) {
          sep = ' / ';
        } else if (sep === ' /') {
          mon = mon.substring(0, 1);
          sep = '';
        } else if (mon.length === 2 || sep.length > 0) {
          sep = ' / ';
        } else if (mon.length === 1 && (mon !== '0' && mon !== '1')) {
          mon = "0" + mon;
          sep = ' / ';
        }
        return mon + sep + year;
      },
      checkIfValidCard : function(){
        var validated = cardComponent.gotValidCard();
        if(registerSubmit){
          state = validated ? bt.compState.start : bt.compState.disabled;
          domManipulation.changeState(registerSubmit, state);
        }
        return validated;
      }
    }
    // Bootstrap : Initializer
    var bootstrap = {
      registerComponents: function() {
        // Register Inputs
        for (var i = 0; i < set.inputs.length; i++) {
          var thisInput = set.inputs[i];
          if ((thisInput.id != "" && $(thisInput.id).length) && bt.inputTypes[thisInput.type] !== undefined)
            registeredInputs.push({
            dom : "input",
            type: thisInput.type,
            conf: bt.inputTypes[thisInput.type],
            jobj: $(thisInput.id)
          });
        }
        // Register submit
        if(set.submit){
          registerSubmit = {jobj:$(set.submit.id),dom:"button",type :"submit"}
        }
        // Register data commerce
        if(set.commerce){
          transport.commerce = set.commerce;
          if(set.commerce.adquirer){
            cardComponent.adquirer = set.commerce.adquirer;
          }
        }
      },
      elementsFactory: function() {
        // Build inputs
        for (var i = 0; i < registeredInputs.length; i++) {
          $input = registeredInputs[i];
          // Set Dom Manipulation
          if ($input.type == "cvc" || $input.type == "exp") {
            domManipulation.changeState($input, bt.compState.disabled);
          } else {
            domManipulation.changeState($input, bt.compState.start);
          }
          // Bind events to inputs
          bootstrap.eventBinding($input);
        }
        // Build submit
        if(registerSubmit){
          bootstrap.eventBinding(registerSubmit);
        
          domManipulation.changeState(registerSubmit, bt.compState.disabled);

        }
      },
      eventBinding: function($input) {
        switch ($input.dom) {
          case 'input':
            switch ($input.type) {
              case 'card':
                $input.jobj.on('keyup', function(e) {
                  return eventRequester.numbChanged.onKeyup(e, $input);
                }).on('keypress', function(e) {
                  return eventRequester.numbChanged.onKeypress(e, $input);
                }).on('input', function(e) {
                  return eventRequester.numbChanged.onInput(e, $input);
                }).on('paste', function(e) {
                  return eventRequester.numbChanged.onPaste(e, $input);
                }).on('change', function(e) {
                  return eventRequester.numbChanged.onChange(e, $input);
                });
                break;
              case 'cvc':
                $input.jobj.on('keyup', function(e) {
                  return eventRequester.cvcChanged.onKeyup(e, $input);
                }).on('keypress', function(e) {
                  return eventRequester.cvcChanged.onKeypress(e, $input);
                }).on('input', function(e) {
                  return eventRequester.cvcChanged.onInput(e, $input);
                }).on('paste', function(e) {
                  return eventRequester.cvcChanged.onPaste(e, $input);
                }).on('change', function(e) {
                  return eventRequester.cvcChanged.onChange(e, $input);
                });
                break;
              case 'exp':
                $input.jobj.on('keyup', function(e) {
                  return eventRequester.expChanged.onKeyup(e, $input);
                }).on('keypress', function(e) {
                  return eventRequester.expChanged.onKeypress(e, $input);
                }).on('keydown', function(e) {
                  return eventRequester.expChanged.onKeydown(e, $input);
                }).on('input', function(e) {
                  return eventRequester.expChanged.onInput(e, $input);
                }).on('paste', function(e) {
                  return eventRequester.expChanged.onPaste(e, $input);
                }).on('change', function(e) {
                  return eventRequester.expChanged.onChange(e, $input);
                });
                break;
              case 'email':
                $input.jobj.on('keyup', function(e) {
                  return eventRequester.emailChanged.onKeyup(e, $input);
                }).on('keypress', function(e) {
                  return eventRequester.emailChanged.onKeypress(e, $input);
                }).on('input', function(e) {
                  return eventRequester.emailChanged.onInput(e, $input);
                }).on('paste', function(e) {
                  return eventRequester.emailChanged.onPaste(e, $input);
                }).on('change', function(e) {
                  return eventRequester.emailChanged.onChange(e, $input);
                });
                break;
              case 'text':
                break;
            }
            break;
          case 'button':
            switch ($input.type) {
              case 'submit':
                $input.jobj.on('click', function(e) {
                  return eventRequester.cardReady.onSubmit(e, $input);
                })
                break;
            }
            break;
        }
      },
      init: function() {
        bootstrap.registerComponents();
        bootstrap.elementsFactory();
      }
    }

    if(opts!=undefined && set!=""){
      bootstrap.init();
    }

    return {
      isCardNumberValid : function(num){
        return dataValidation.validateCardNumber(num);
      },
      isCardCvcValid : function(num){
        return dataValidation.validateCardCVC(num);
      }
    }
  };
}(jQuery));
