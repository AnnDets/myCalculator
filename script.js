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
        let normalized = value
            .replace(/,/g, '.')
            .replace(/[^\d.-]/g, '');
        
        if (normalized.includes('-')) {
            const parts = normalized.split('-');
            if (parts.length > 2) {
                normalized = '-' + parts.slice(1).join('').replace(/-/g, '');
            }
        }
        
        if ((normalized.match(/\./g) || []).length > 1) {
            const parts = normalized.split('.');
            normalized = parts[0] + '.' + parts.slice(1).join('');
        }
        
        return normalized;
    }

    handleInput(inputElement) {
        const normalizedValue = this.normalizeInput(inputElement.value);
        if (normalizedValue !== inputElement.value) {
            inputElement.value = normalizedValue;
        }
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

    validateNumber(value) {
        if (value === '' || value === '-' || value === '.') {
            return { isValid: false, error: 'Введите число' };
        }
        
        const numObj = this.parseNumber(value);
        
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
        
        integerStr = integerStr.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
        
        let result = isNegative ? `(${integerStr}` : integerStr;
        
        if (numObj.decimal !== '0') {
            let decimal = numObj.decimal;
            while (decimal.endsWith('0')) {
                decimal = decimal.slice(0, -1);
            }
            if (decimal.length > 0) {
                result += '.' + decimal;
            }
        }
        
        if (isNegative) {
            result += ')';
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
            this.resultValue.textContent = 'ОШИБКА!';
            this.resultValue.style.color = '#dc3545';
            this.calculationSteps.textContent = 'Произошла ошибка при вычислении';
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});