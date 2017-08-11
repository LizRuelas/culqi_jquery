define(function () {
    //Do setup work here

    var _cards = [{
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
      type: 'dinersclub',
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

    var _currentCard = {
      number: "",
      type: "",
      cvc: "",
      valid: ""
    }

    var _inputsAvailable = {
      type: {
        card: {},
        exp: {},
        cvc: {},
        email: {},
        text: {}
      },
      state: {
        success: "has-success",
        failed: "has-error",
        disabled: "has-disabled",
        start: "has-start"
      }
    }

    var registeredInputs = [];

    return {
        cards : _cards,
        currentCard : currentCard,
        inputsAvailable : _inputsAvailable

    }
});