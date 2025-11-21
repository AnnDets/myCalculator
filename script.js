class Calculator {
    constructor() {
        this.MIN_VALUE = -1000000000000;
        this.MAX_VALUE = 1000000000000;
        this.DECIMAL_PLACES = 6;
        
        this.number1Input = document.getElementById('number1');
        this.number2Input = document.getElementById('number2');
        this.operationBtns = document.querySelectorAll('.operation-btn');
        this.calculateBtn = document.getElementById('calculateBtn');
        this.resultValue = document.getElementById('resultValue');
        this.calculationSteps = document.getElementById('calculationSteps');
        this.error1 = document.getElementById('error1');
        this.error2 = document.getElementById('error2');

        this.selectedOperation = null;
        this.initEventListeners();
    }

    initEventListeners() {
        this.number1Input.addEventListener('input', () => {
            this.handleInput(this.number1Input);
            this.validateInputs();
        });
        
        this.number2Input.addEventListener('input', () => {
            this.handleInput(this.number2Input);
            this.validateInputs();
        });

        this.number1Input.addEventListener('keydown', (e) => this.handleHotkeys(e));
        this.number2Input.addEventListener('keydown', (e) => this.handleHotkeys(e));
        
        this.operationBtns.forEach(btn => {
            btn.addEventListener('click', () => this.selectOperation(btn));
        });

        this.calculateBtn.addEventListener('click', () => this.calculate());

        document.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !this.calculateBtn.disabled) {
                this.calculate();
            }
        });
    }

    handleHotkeys(event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
            event.preventDefault();
            this.copyToClipboard(event.target);
        }

        if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
            event.preventDefault();
            this.pasteFromClipboard(event.target);
        }
    }

    async copyToClipboard(element) {
        try {
            const text = element.value;
            if (text) {
                await navigator.clipboard.writeText(text);
            }
        } catch (err) {
            console.log('Copy failed');
        }
    }

    async pasteFromClipboard(element) {
        try {
            const text = await navigator.clipboard.readText();
            this.handlePastedText(element, text);
        } catch (err) {
            console.log('Paste failed');
        }
    }

    handlePastedText(element, text) {
        const cleanedText = this.normalizeInput(text);
        if (cleanedText) {
            element.value = cleanedText;
            this.handleInput(element);
            this.validateInputs();
        }
    }

    normalizeInput(value) {
        let cleaned = value.replace(/[^\d\s.,-]/g, '');
        
        let normalized = cleaned.replace(/,/g, '.');
        
        if (normalized.includes('-')) {
            const parts = normalized.split('-');
            if (parts.length > 2) {
                normalized = '-' + parts.slice(1).join('').replace(/-/g, '');
            }
            if (normalized.lastIndexOf('-') > 0) {
                normalized = normalized.replace(/-/g, '');
                normalized = '-' + normalized;
            }
        }
        
        if ((normalized.match(/\./g) || []).length > 1) {
            const parts = normalized.split('.');
            normalized = parts[0] + '.' + parts.slice(1).join('');
        }
        
        return normalized;
    }

    isValidSpacing(value) {
        if (value.trim() === '') return true;
        
        const parts = value.split('.');
        const integerPart = parts[0];
        
        if (integerPart && !this.isValidIntegerSpacing(integerPart)) {
            return false;
        }
        
        if (parts.length > 1 && parts[1].includes(' ')) {
            return false;
        }
        
        return true;
    }

    isValidIntegerSpacing(integerStr) {
        let str = integerStr;
        const hasMinus = str.startsWith('-');
        if (hasMinus) {
            str = str.substring(1);
        }
        
        if (!str.includes(' ')) {
            return true;
        }
        
        const groups = str.split(' ').filter(group => group !== '');
        
        if (str.includes('  ')) {
            return false;
        }
        
        for (let i = 0; i < groups.length; i++) {
            const group = groups[i];
            
            if (i === 0) {
                if (group.length < 1 || group.length > 3) {
                    return false;
                }
            } else {
                if (group.length !== 3) {
                    return false;
                }
            }
            
            if (!/^\d+$/.test(group)) {
                return false;
            }
        }
        
        return true;
    }


    handleInput(inputElement) {
        const originalValue = inputElement.value;
        const normalizedValue = this.normalizeInput(originalValue);
        
        if (normalizedValue !== originalValue) {
            inputElement.value = normalizedValue;
        }
        
        this.validateInputs();
    }

    parseNumber(value) {
        if (value === '' || value === '-' || value === '.') {
            return null;
        }
        
        const normalized = value.replace(/,/g, '.');
        
        const parts = normalized.split('.');
        const integerPart = parts[0];
        const decimalPart = parts[1] || '';
        
        if (decimalPart === '') {
            try {
                return {
                    integer: BigInt(integerPart),
                    decimal: '0',
                    isInteger: true
                };
            } catch (e) {
                return null;
            }
        } else {
            try {
                return {
                    integer: BigInt(integerPart),
                    decimal: decimalPart.padEnd(this.DECIMAL_PLACES, '0').substring(0, this.DECIMAL_PLACES),
                    isInteger: false
                };
            } catch (e) {
                return null;
            }
        }
    }

    toNumber(numObj) {
        const integer = Number(numObj.integer);
        const decimal = numObj.decimal === '0' ? 0 : Number('0.' + numObj.decimal);
        return integer + (numObj.integer >= 0n ? decimal : -decimal);
    }

    addNumbers(num1, num2) {
        if (num1.isInteger && num2.isInteger) {
            const result = num1.integer + num2.integer;
            return {
                integer: result,
                decimal: '0',
                isInteger: true
            };
        } else {
            const maxDecimalLength = Math.max(num1.decimal.length, num2.decimal.length);
            const decimal1 = num1.decimal.padEnd(maxDecimalLength, '0');
            const decimal2 = num2.decimal.padEnd(maxDecimalLength, '0');
            
            const num1Total = BigInt(num1.integer.toString() + decimal1) * (num1.integer >= 0n ? 1n : -1n);
            const num2Total = BigInt(num2.integer.toString() + decimal2) * (num2.integer >= 0n ? 1n : -1n);
            
            let result = num1Total + num2Total;
            const isNegative = result < 0n;
            if (isNegative) result = -result;
            
            const resultStr = result.toString().padStart(maxDecimalLength + 1, '0');
            const integerPart = resultStr.slice(0, -maxDecimalLength) || '0';
            let decimalPart = resultStr.slice(-maxDecimalLength);
            
            decimalPart = decimalPart.substring(0, this.DECIMAL_PLACES);
            
            return {
                integer: BigInt((isNegative ? '-' : '') + integerPart),
                decimal: decimalPart,
                isInteger: decimalPart === '0'
            };
        }
    }

    subtractNumbers(num1, num2) {
        if (num1.isInteger && num2.isInteger) {
            const result = num1.integer - num2.integer;
            return {
                integer: result,
                decimal: '0',
                isInteger: true
            };
        } else {
            const maxDecimalLength = Math.max(num1.decimal.length, num2.decimal.length);
            const decimal1 = num1.decimal.padEnd(maxDecimalLength, '0');
            const decimal2 = num2.decimal.padEnd(maxDecimalLength, '0');
            
            const num1Total = BigInt(num1.integer.toString() + decimal1) * (num1.integer >= 0n ? 1n : -1n);
            const num2Total = BigInt(num2.integer.toString() + decimal2) * (num2.integer >= 0n ? 1n : -1n);
            
            let result = num1Total - num2Total;
            const isNegative = result < 0n;
            if (isNegative) result = -result;
            
            const resultStr = result.toString().padStart(maxDecimalLength + 1, '0');
            const integerPart = resultStr.slice(0, -maxDecimalLength) || '0';
            let decimalPart = resultStr.slice(-maxDecimalLength);
            
            decimalPart = decimalPart.substring(0, this.DECIMAL_PLACES);
            
            return {
                integer: BigInt((isNegative ? '-' : '') + integerPart),
                decimal: decimalPart,
                isInteger: decimalPart === '0'
            };
        }
    }

    multiplyNumbers(num1, num2) {
        if (num1.isInteger && num2.isInteger) {
            const result = num1.integer * num2.integer;
            return {
                integer: result,
                decimal: '0',
                isInteger: true
            };
        } else {
            const totalDecimalPlaces = num1.decimal.length + num2.decimal.length;
            const num1Total = BigInt(num1.integer.toString() + num1.decimal) * (num1.integer >= 0n ? 1n : -1n);
            const num2Total = BigInt(num2.integer.toString() + num2.decimal) * (num2.integer >= 0n ? 1n : -1n);
            
            let result = num1Total * num2Total;
            const isNegative = result < 0n;
            if (isNegative) result = -result;
            
            let resultStr = result.toString().padStart(totalDecimalPlaces + 1, '0');
            const integerPart = resultStr.slice(0, -totalDecimalPlaces) || '0';
            let decimalPart = resultStr.slice(-totalDecimalPlaces);
            
            if (decimalPart.length > this.DECIMAL_PLACES) {
                decimalPart = this.roundDecimal(decimalPart, this.DECIMAL_PLACES);
            } else {
                decimalPart = decimalPart.padEnd(this.DECIMAL_PLACES, '0').substring(0, this.DECIMAL_PLACES);
            }
            
            return {
                integer: BigInt((isNegative ? '-' : '') + integerPart),
                decimal: decimalPart,
                isInteger: decimalPart === '0'
            };
        }
    }

    divideNumbers(num1, num2) {
        if (num2.integer === 0n && num2.decimal === '0') {
            throw new Error('Деление на ноль');
        }

        const num1Value = this.toNumber(num1);
        const num2Value = this.toNumber(num2);
        
        let result = num1Value / num2Value;
        
        result = Math.round(result * 1000000) / 1000000;
        
        if (result < this.MIN_VALUE || result > this.MAX_VALUE) {
            throw new Error('Переполнение');
        }
        
        return this.numberToResultObject(result);
    }

    numberToResultObject(number) {
        if (number === 0) {
            return {
                integer: 0n,
                decimal: '0',
                isInteger: true
            };
        }
        
        const isNegative = number < 0;
        const absoluteNumber = Math.abs(number);
        
        const integerPart = Math.floor(absoluteNumber);
        let decimalPart = absoluteNumber - integerPart;
        
        let decimalStr = '';
        if (decimalPart > 0) {
            let decimalInt = Math.round(decimalPart * 1000000);
            
            if (decimalInt === 1000000) {
                decimalInt = 0;
                return this.numberToResultObject(
                    (isNegative ? -1 : 1) * (integerPart + 1)
                );
            }
            
            decimalStr = decimalInt.toString().padStart(6, '0');
            
            while (decimalStr.endsWith('0')) {
                decimalStr = decimalStr.slice(0, -1);
            }
        } else {
            decimalStr = '0';
        }
        
        return {
            integer: BigInt((isNegative ? '-' : '') + integerPart.toString()),
            decimal: decimalStr,
            isInteger: decimalStr === '0'
        };
    }

    mathRound(number, scale) {
        const absNumber = number < 0n ? -number : number;
        const remainder = absNumber % scale;
        
        if (remainder * 2n >= scale) {
            return number < 0n ? 
                   (number - (scale - remainder)) / scale : 
                   (number + (scale - remainder)) / scale;
        } else {
            return number / scale;
        }
    }

    roundDecimal(decimalStr, maxLength) {
        if (decimalStr.length <= maxLength) {
            return decimalStr;
        }
        
        const toRound = decimalStr.substring(0, maxLength + 1);
        const lastDigit = parseInt(toRound.charAt(maxLength));
        let rounded = toRound.substring(0, maxLength);
        
        if (lastDigit >= 5) {
            let carry = 1;
            let result = '';
            for (let i = maxLength - 1; i >= 0; i--) {
                let digit = parseInt(rounded.charAt(i)) + carry;
                carry = Math.floor(digit / 10);
                result = (digit % 10) + result;
            }
            if (carry > 0) {
                result = carry + result;
            }
            return result.padStart(maxLength, '0').substring(0, maxLength);
        } else {
            return rounded;
        }
    }

    validateNumber(value) {
        if (value === '' || value === '-' || value === '.') {
            return { isValid: false, error: 'Введите число' };
        }
        
        if (!this.isValidSpacing(value)) {
            return { isValid: false, error: 'Неправильная расстановка пробелов' };
        }
        
        const valueWithoutSpaces = value.replace(/\s/g, '');
        const numObj = this.parseNumber(valueWithoutSpaces);
        
        if (!numObj) {
            return { isValid: false, error: 'Неверный формат числа' };
        }
        
        const numValue = this.toNumber(numObj);
        
        if (numValue < this.MIN_VALUE || numValue > this.MAX_VALUE) {
            return { isValid: false, error: 'Число вне диапазона' };
        }
        
        return { isValid: true, num: numObj };
    }

    validateInputs() {
        const num1Valid = this.validateNumber(this.number1Input.value);
        const num2Valid = this.validateNumber(this.number2Input.value);
        
        this.error1.textContent = num1Valid.isValid ? '' : num1Valid.error;
        this.error2.textContent = num2Valid.isValid ? '' : num2Valid.error;

        this.calculateBtn.disabled = !(num1Valid.isValid && num2Valid.isValid && this.selectedOperation);
    }

    selectOperation(clickedBtn) {
        this.operationBtns.forEach(btn => btn.classList.remove('active'));
        clickedBtn.classList.add('active');
        this.selectedOperation = clickedBtn.dataset.operation;
        this.validateInputs();
    }

    formatNumber(numObj) {
        let integerStr = numObj.integer.toString();
        const isNegative = integerStr.startsWith('-');
        
        if (isNegative) {
            integerStr = integerStr.substring(1);
        }
        
        if (integerStr === '') {
            integerStr = '0';
        }
        
        let formattedInteger = '';
        let count = 0;
        
        for (let i = integerStr.length - 1; i >= 0; i--) {
            formattedInteger = integerStr[i] + formattedInteger;
            count++;
            if (count % 3 === 0 && i !== 0) {
                formattedInteger = ' ' + formattedInteger;
            }
        }
        
        let decimalPart = numObj.decimal;
        
        while (decimalPart.endsWith('0')) {
            decimalPart = decimalPart.slice(0, -1);
        }
        
        let result = formattedInteger;
        
        if (decimalPart.length > 0) {
            result += '.' + decimalPart;
        }
        
        if (isNegative) {
            result = '-' + result;
        }
        
        return result;
    }

    checkOverflow(numObj) {
        const numValue = this.toNumber(numObj);
        return numValue < this.MIN_VALUE || numValue > this.MAX_VALUE;
    }

    calculate() {
        if (!this.selectedOperation) return;

        const num1Valid = this.validateNumber(this.number1Input.value);
        const num2Valid = this.validateNumber(this.number2Input.value);
        
        if (!num1Valid.isValid || !num2Valid.isValid) return;

        const num1 = num1Valid.num;
        const num2 = num2Valid.num;

        let result, explanation;

        try {
            switch (this.selectedOperation) {
                case 'addition':
                    result = this.addNumbers(num1, num2);
                    explanation = `Сумма ${this.formatNumber(num1)} и ${this.formatNumber(num2)}`;
                    break;
                case 'subtraction':
                    result = this.subtractNumbers(num1, num2);
                    explanation = `Разность ${this.formatNumber(num1)} и ${this.formatNumber(num2)}`;
                    break;
                case 'multiplication':
                    result = this.multiplyNumbers(num1, num2);
                    explanation = `Произведение ${this.formatNumber(num1)} и ${this.formatNumber(num2)}`;
                    break;
                case 'division':
                    result = this.divideNumbers(num1, num2);
                    explanation = `Частное ${this.formatNumber(num1)} и ${this.formatNumber(num2)}`;
                    break;
                default:
                    throw new Error('Неизвестная операция');
            }

            if (this.checkOverflow(result)) {
                this.resultValue.textContent = 'ПЕРЕПОЛНЕНИЕ!';
                this.resultValue.style.color = '#dc3545';
                this.calculationSteps.textContent = `${explanation} = вне диапазона`;
            } else {
                this.resultValue.textContent = this.formatNumber(result);
                this.resultValue.style.color = '#28a745';
                this.calculationSteps.textContent = `${explanation} = ${this.formatNumber(result)}`;
            }
        } catch (error) {
            if (error.message === 'Деление на ноль') {
                this.resultValue.textContent = 'ОШИБКА: Деление на ноль!';
            } else {
                this.resultValue.textContent = 'ОШИБКА!';
            }
            this.resultValue.style.color = '#dc3545';
            this.calculationSteps.textContent = error.message || 'Произошла ошибка при вычислении';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});