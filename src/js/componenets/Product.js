import { templates, select, classNames } from '../settings.js';
import { utils } from '../utils.js';
import { AmountWidget } from './AmountWidget.js';


export class Product {
  constructor(id, data) {
    const thisProduct = this;

    thisProduct.id = id;
    thisProduct.data = data;

    thisProduct.renderInMenu();
    thisProduct.getElements();
    thisProduct.initAccordion();
    thisProduct.initOrderForm();
    thisProduct.initAmountWidget();
    thisProduct.processOrder();

    // console.log('new Product', thisProduct);
  }

  renderInMenu() {

    const thisProduct = this;

    /* generate HTML from template*/

    const generateHTML = templates.menuProduct(thisProduct.data);

    /* create elements from utils.*/
    thisProduct.element = utils.createDOMFromHTML(generateHTML);

    /* find meny container*/
    const menuContainer = document.querySelector(select.containerOf.menu);

    /* add element to menu*/
    menuContainer.appendChild(thisProduct.element);
  }

  getElements() {
    const thisProduct = this;

    thisProduct.accordionTrigger = thisProduct.element.querySelector(select.menuProduct.clickable);
    thisProduct.form = thisProduct.element.querySelector(select.menuProduct.form);// formularz dodatków
    thisProduct.formInputs = thisProduct.form.querySelectorAll(select.all.formInputs); // do zaznaczania okienka
    thisProduct.cartButton = thisProduct.element.querySelector(select.menuProduct.cartButton);// buton dodaj do karty
    thisProduct.priceElem = thisProduct.element.querySelector(select.menuProduct.priceElem);// suma kasy
    thisProduct.imageWrapper = thisProduct.element.querySelector(select.menuProduct.imageWrapper);
    thisProduct.amountWidgetElem = thisProduct.element.querySelector(select.menuProduct.amountWidget);
  }

  initAccordion() {
    const thisProduct = this;

    /* find the clickable trigger (the element that should react to clicking) */
    const clickableTrigger = thisProduct.accordionTrigger;
    // console.log('clickableTrigger:', clickableTrigger);

    /* START: click event listener to trigger */

    clickableTrigger.addEventListener('click', function (event) {
      // console.log('clicked');

      /* prevent default action for event */
      event.preventDefault();

      /* toggle active class on element of thisProduct */
      thisProduct.element.classList.toggle(classNames.menuProduct.wrapperActive);// dodanie lub oderbanie klasy active

      /* find all active products */

      const activeProducts = document.querySelectorAll(select.all.menuProducts);
      // console.log('activeProduct:', activeProducts);

      /* START LOOP: for each active product */
      for (let activeProduct of activeProducts) {


        /* START: if the active product isn't the element of thisProduct */
        if (activeProduct != thisProduct.element) {

          /* remove class active for the active product */
          activeProduct.classList.remove(classNames.menuProduct.wrapperActive);

          /* END: if the active product isn't the element of thisProduct */
        }
        /* END LOOP: for each active product */
      }

      /* END: click event listener to trigger */
    });
  }


  initOrderForm() {
    const thisProduct = this;

    thisProduct.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisProduct.processOrder();
    });

    for (let input of thisProduct.formInputs) {
      input.addEventListener('change', function () {
        thisProduct.processOrder();
      });
    }

    thisProduct.cartButton.addEventListener('click', function (event) {
      event.preventDefault();
      thisProduct.addToCart();
      thisProduct.processOrder();
    });

  }

  processOrder() {

    const thisProduct = this;

    /* read all data from the form (using utils.serializeFormToObject) and save it to const formData */

    const formData = utils.serializeFormToObject(thisProduct.form);// aktualizuje się po kliknięciu
    //console.log('formData:', formData);// zwraca obiekt, klucze: np. sauce, wlasciwości [" tomato",..] i tp

    thisProduct.params = {};

    /* set variable price to equal thisProduct.data.price */
    let price = thisProduct.data.price;
    // console.log('price:', price);

    /* START LOOP: for each paramId in thisProduct.data.params */

    for (let paramId in thisProduct.data.params) {
      // console.log('paramId:', paramId);

      /* save the element in thisProduct.data.params with key paramId as const param */

      const param = thisProduct.data.params[paramId];
      //console.log('param:', param);// uwzględnia wszystkie params z danego dania

      /* START LOOP: for each optionId in param.options */

      for (let optionId in param.options) {

        /* save the element in param.options with key optionId as const option */

        const option = param.options[optionId];
        // console.log('option:', option);
        const optionSelected = formData.hasOwnProperty(paramId) && formData[paramId].indexOf(optionId) > -1;
        // console.log('optionSelected:', optionSelected);

        /* START IF: if option is selected and option is not default */
        if (optionSelected && !option.default) {

          /* add price of option to variable price */

          price += option.price;
          //console.log(price);
          /* END IF: if option is selected and option is not default */
        }
        /* START ELSE IF: if option is not selected and option is default */
        else if (!optionSelected && option.default) {

          /* deduct price of option from price */
          price -= option.price;
          // console.log(price);
          /* END ELSE IF: if option is not selected and option is default */
        }
        /* if optionSelected - add class 'active' to all images of this option*/

        const images = thisProduct.imageWrapper.querySelectorAll('.' + paramId + '-' + optionId);
        //console.log('images:', images);

        if (optionSelected) {
          if (!thisProduct.params[paramId]) {
            thisProduct.params[paramId] = {
              label: param.label,
              options: {},
            };
          }
          thisProduct.params[paramId].options[optionId] = option.label;

          for (let image of images) {
            image.classList.add('active');
          }
        }
        /*else if = remove class */
        else if (!optionSelected) {
          for (let image of images) {
            image.classList.remove('active');
          }
        }
        /* END LOOP: for each optionId in param.options */
      }
      /* END LOOP: for each paramId in thisProduct.data.params */
      console.log('thisProduct.params', thisProduct.params);
    }

    /* multiply price by amount */
    thisProduct.priceSingle = price;
    thisProduct.price = thisProduct.priceSingle * thisProduct.amountWidget.value;

    /* set the contents of thisProduct.priceElem to be the value of variable price */
    thisProduct.priceElem.innerHTML = thisProduct.price;

  }

  initAmountWidget() {
    const thisProduct = this;
    thisProduct.amountWidget = new AmountWidget(thisProduct.amountWidgetElem);

    thisProduct.amountWidgetElem.addEventListener('update', function () {
      thisProduct.processOrder();
    });
  }

  addToCart() {
    const thisProduct = this;

    thisProduct.name = thisProduct.data.name;
    thisProduct.amount = thisProduct.amountWidget.value;

    const event = new CustomEvent('add-to-cart', {
      bubbles: true,
      detail: {
        product: thisProduct,
      },
    });

    thisProduct.element.dispatchEvent(event);
  }
}
