/* 
export class QRadio extends HTMLElement {
  labelEl!: HTMLLabelElement
  inputEl!: HTMLInputElement
  spanEl!: HTMLSpanElement
  textNodeEl!: HTMLSpanElement
  constructor() {
    super()
    const shadow = this.attachShadow({ mode: 'open' })

    // 创建HTML元素
    const label = document.createElement('label')
    this.labelEl = label
    label.classList.add('q-radio')

    const input = document.createElement('input')
    this.inputEl = input
    input.setAttribute('type', 'radio')

    const span = document.createElement('span')
    this.spanEl = span
    span.classList.add('q-radio__input')
    span.setAttribute('data-number', '')

    const textNode = document.createElement('span')
    this.textNodeEl = textNode
    textNode.classList.add('q-radio__label')

    label.appendChild(input)
    label.appendChild(span)
    label.appendChild(textNode)
    shadow.appendChild(label)

    // 创建样式元素
    const style = document.createElement('style')
    style.textContent = `
      .q-radio {
        display: inline-flex;
      }

      .q-radio,
      .q-radio__input {
        align-items: center;
        position: relative;
      }

      .q-radio__input {
        background-color: transparent;
        border: 1px solid var(--fill_standard_primary);
        border-radius: 50%;
        box-sizing: border-box;
        display: inline-block;
        display: flex;
        height: 18px;
        justify-content: center;
        vertical-align: middle;
        width: 18px;
      }

      .q-radio__input:after {
        background-color: var(--brand_standard);
        border-radius: 10px;
        content: "";
        height: 10px;
        position: absolute;
        visibility: hidden;
        width: 10px;
      }

      .q-radio__label {
        margin-left: 5px;
        margin-right: 10px;
      }

      .q-radio:not(.is-disabled):hover .q-radio__input {
        background-color: var(--overlay_hover);
      }

      .q-radio:not(.is-disabled):hover .q-radio__input:after {
        background-color: var(--nt_brand_standard_2_overlay_hover_brand_2_mix);
      }

      .q-radio:not(.is-disabled):active .q-radio__input {
        background-color: var(--overlay_pressed);
      }

      .q-radio:not(.is-disabled):active .q-radio__input:after {
        background-color: var(--nt_brand_standard_2_overlay_pressed_brand_2_mix);
      }

      .q-radio.is-disabled {
        cursor: not-allowed;
        opacity: .3;
      }

      .q-radio.is-checked .q-radio__input:after {
        visibility: visible;
      }
      input, textarea {
        appearance: none;
        background-repeat: initial;
        border-top-left-radius: 0px;
        border-top-right-radius: 0px;
        border-bottom-right-radius: 0px;
        border-bottom-left-radius: 0px;
        box-sizing: border-box;
        background: none;
        border: none;
        padding: 0px;
      }
    `
    shadow.appendChild(style)

    // 监听input的变化
    input.addEventListener('change', () => {
      if (input.checked) {
        label.classList.add('is-checked')
      } else {
        label.classList.remove('is-checked')
      }
    })
  }

  static get observedAttributes() {
    return ['label', 'name', 'value']
  }

  attributeChangedCallback(name: string, _oldValue: string | null, newValue: string | null) {
    switch (name) {
      case 'label':
        this.textNodeEl.textContent = newValue
        break
      case 'name':
        this.inputEl.setAttribute('name', newValue || '')
        break
      case 'value':
        this.inputEl.setAttribute('value', newValue || '')
        break
      default:
        break
    }
  }

  connectedCallback() {
    if (this.hasAttribute('label')) {
      this.textNodeEl.textContent = this.getAttribute('label')
    }
    if (this.hasAttribute('name')) {
      this.inputEl.setAttribute('name', this.getAttribute('name') || '')
    }
    if (this.hasAttribute('value')) {
      this.inputEl.setAttribute('value', this.getAttribute('value') || '')
    }
  }
}

customElements.define('q-radio', QRadio) */

export class QCheck {
  labelEl!: HTMLLabelElement
  inputEl!: HTMLInputElement
  spanEl!: HTMLSpanElement
  textNodeEl!: HTMLSpanElement
  constructor(options: { label: string; name?: string; value?: string; checked: boolean; type: 'radio' | 'checkbox' }) {
    // 创建HTML元素
    const label = document.createElement('label')
    this.labelEl = label
    label.classList.add(`q-${options.type}`)

    const input = document.createElement('input')
    this.inputEl = input
    options.name && input.setAttribute('name', options.name)
    options.value && input.setAttribute('value', options.value)
    input.setAttribute('type', options.type)
    input.checked = options.checked

    const span = document.createElement('span')
    this.spanEl = span
    span.classList.add(`q-${options.type}__input`)

    const textNode = document.createElement('span')
    this.textNodeEl = textNode
    textNode.style.marginLeft = '5px'
    textNode.textContent = options.label
    // textNode.classList.add('q-radio__label')

    label.appendChild(input)
    label.appendChild(span)
    label.appendChild(textNode)
    input.addEventListener('change', () => {
      if (input.checked) {
        label.classList.add('is-checked')
      } else {
        label.classList.remove('is-checked')
      }
    })
    if (input.checked) {
      label.classList.add('is-checked')
    } else {
      label.classList.remove('is-checked')
    }
  }
}

export class QInput {
  prefixEL!: HTMLDivElement
  inputEl!: HTMLInputElement
  clearEl!: HTMLDivElement

  element!: HTMLDivElement

  constructor(options: {
    name?: string
    value?: string
    type: 'text' | 'password' | 'number' | 'email' | 'tel' | 'url' | 'search' | 'date' | 'time' | 'datetime-local' | 'month' | 'week' | 'color' | 'file' | 'hidden' | 'reset' | 'submit' | 'button'
    clearable?: boolean
    placeholder?: string
  }) {
    this.element = document.createElement('div')
    this.element.classList.add('q-input')
    // this.prefixEL = document.createElement('div')
    // this.prefixEL.classList.add('q-input__prefix')
    this.clearEl = document.createElement('div')
    this.clearEl.classList.add('q-input__clear')
    this.clearEl.innerHTML = `<i class="q-svg-icon q-icon" role="button" bf-label-inner="true" tabindex="0" aria-label="清空" style="width: 16px; height: 16px; --340fd034: var(--icon_secondary);"><svg viewBox="0 0 24 24"><use xlink:href="/_upper_/resource/icons/close_24.svg#close_24"></use></svg></i>`
    this.clearEl.style.display = 'none'

    this.inputEl = document.createElement('input')
    this.inputEl.spellcheck = false
    this.inputEl.type = options.type
    this.inputEl.name = options.name || ''
    this.inputEl.value = options.value || ''
    this.inputEl.placeholder = options.placeholder || ''
    this.inputEl.classList.add('q-input__inner')

    this.element.appendChild(this.inputEl)
    if (options.clearable) {
      this.inputEl.classList.add('q-input__clearable')
      this.inputEl.addEventListener('input', () => {
        if (this.inputEl.value) {
          this.clearEl.style.display = 'flex'
        } else {
          this.clearEl.style.display = 'none'
        }
      })
      this.clearEl.addEventListener('click', () => {
        this.inputEl.value = ''
      })
      this.element.appendChild(this.clearEl)
    }
  }
}
