
/* global Handlebars, utils, dataSource */ // eslint-disable-line no-unused-vars

// const { active } = require("browser-sync");

// const { utils } = require("stylelint");

{
  'use strict';

  const select = {
    templateOf: {
      menuProduct: '#template-menu-product',
      cartProduct: '#template-cart-product', // CODE ADDED
    },
    containerOf: {
      menu: '#product-list',
      cart: '#cart',
    },
    all: {
      menuProducts: '#product-list > .product',
      menuProductsActive: '#product-list > .product.active',
      formInputs: 'input, select',
    },
    menuProduct: {
      clickable: '.product__header',
      form: '.product__order',
      priceElem: '.product__total-price .price',
      imageWrapper: '.product__images',
      amountWidget: '.widget-amount',
      cartButton: '[href="#add-to-cart"]',
    },
    widgets: {
      amount: {
        input: 'input.amount', // CODE CHANGED
        linkDecrease: 'a[href="#less"]',
        linkIncrease: 'a[href="#more"]',
      },
    },
    // CODE ADDED START
    cart: {
      productList: '.cart__order-summary',
      toggleTrigger: '.cart__summary',
      totalNumber: `.cart__total-number`,
      totalPrice: '.cart__total-price strong, .cart__order-total .cart__order-price-sum strong',
      subtotalPrice: '.cart__order-subtotal .cart__order-price-sum strong',
      deliveryFee: '.cart__order-delivery .cart__order-price-sum strong',
      form: '.cart__order',
      formSubmit: '.cart__order [type="submit"]',
      phone: '[name="phone"]',
      address: '[name="address"]',
    },
    cartProduct: {
      amountWidget: '.widget-amount',
      price: '.cart__product-price',
      edit: '[href="#edit"]',
      remove: '[href="#remove"]',
    },
    // CODE ADDED END
  };

  const classNames = {
    menuProduct: {
      wrapperActive: 'active',
      imageVisible: 'active',
    },
    // CODE ADDED START
    cart: {
      wrapperActive: 'active',
    },
    // CODE ADDED END
  };

  const settings = {
    amountWidget: {
      defaultValue: 1,
      defaultMin: 1,
      defaultMax: 9,
    }, // CODE CHANGED
    // CODE ADDED START
    cart: {
      defaultDeliveryFee: 20,
    },
    // CODE ADDED END
  };

  const templates = {
    menuProduct: Handlebars.compile(document.querySelector(select.templateOf.menuProduct).innerHTML),
    // CODE ADDED START
    cartProduct: Handlebars.compile(document.querySelector(select.templateOf.cartProduct).innerHTML),
    // CODE ADDED END
  };


  class Product {
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

      app.cart.add(thisProduct);

    }
  }


  class AmountWidget {
    constructor(element) {
      const thisWidget = this;


      thisWidget.getElements(element);
      thisWidget.initAction();
      thisWidget.value = settings.amountWidget.defaultValue;
      thisWidget.setValue(thisWidget.input.value);


      // console.log('AmountWidget:', thisWidget);
      // console.log('constructor arguments:', element);
    }


    getElements(element) {
      const thisWidget = this;

      thisWidget.element = element;
      thisWidget.input = thisWidget.element.querySelector(select.widgets.amount.input);
      thisWidget.linkDecrease = thisWidget.element.querySelector(select.widgets.amount.linkDecrease);
      thisWidget.linkIncrease = thisWidget.element.querySelector(select.widgets.amount.linkIncrease);
    }

    setValue(value) {
      const thisWidget = this;
      const newValue = parseInt(value);

      if (newValue != thisWidget.value && newValue >= settings.amountWidget.defaultMin &&
        newValue <= settings.amountWidget.defaultMax) {
        thisWidget.value = newValue;
        thisWidget.announce();
      }

      thisWidget.input.value = thisWidget.value;
    }

    initAction() {

      const thisWidget = this;

      thisWidget.input.addEventListener('change', function () {
        thisWidget.setValue(thisWidget.input.value);
      });

      thisWidget.linkDecrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value - 1);
      });

      thisWidget.linkIncrease.addEventListener('click', function (event) {
        event.preventDefault();
        thisWidget.setValue(thisWidget.value + 1);
      });

    }

    announce() {
      const thisWidget = this;

      const event = new CustomEvent('updated', {
        bubbles: true
      });
      thisWidget.element.dispatchEvent(event);
    }
  }

  class Cart {
    constructor(element) {

      const thisCart = this;
      thisCart.products = []; // tablica z produktami dodanymi do koszyka
      // console.log('new Cart:', thisCart);
      thisCart.deliveryFee = settings.cart.defaultDeliveryFee;

      thisCart.getElements(element);
      thisCart.initAction();
    }

    getElements(element) {
      const thisCart = this;

      thisCart.dom = {};// przechowywanie wszystkich ele. DOM
      thisCart.dom.wrapper = element;
      thisCart.dom.toggleTrigger = thisCart.dom.wrapper.querySelector(select.cart.toggleTrigger);
      thisCart.dom.productList = document.querySelector(select.cart.productList);

      thisCart.renderTotalsKeys = ['totalNumber', 'totalPrice', 'subtotalPrice', 'deliveryFee'];

      for (let key of thisCart.renderTotalsKeys) {
        thisCart.dom[key] = thisCart.dom.wrapper.querySelectorAll(select.cart[key]);
      }
    }

    initAction() {
      const thisCart = this;
      thisCart.dom.toggleTrigger.addEventListener('click', function () {
        thisCart.dom.wrapper.classList.toggle('active');
      });

      thisCart.dom.productList.addEventListener('updated', function () {
        thisCart.update();
      });

      thisCart.dom.productList.addEventListener('remove', function () {
        thisCart.remove(event.detail.cartProduct);
      });
    }

    add(menuProduct) {
      const thisCart = this;

      const generatedHTML = templates.cartProduct(menuProduct);

      /* create DOM using utils.createElementFromHTML */
      const generatedDOM = utils.createDOMFromHTML(generatedHTML);

      /* add DOM to thisCart.dom.productList */
      thisCart.dom.productList.appendChild(generatedDOM);

      // console.log('adding product:', menuProduct);

      thisCart.products.push(new CartProduct(menuProduct, generatedDOM));

      // console.log('thisCard.products:', thisCart.products);
      thisCart.update();
    }

    update() {
      const thisCart = this;

      thisCart.totalNumber = 0;
      thisCart.subtotalPrice = 0;

      for (let thisCartProduct of thisCart.products) {
        thisCart.subtotalPrice += thisCartProduct.price;
        thisCart.totalNumber += thisCartProduct.amount;
      }

      thisCart.totalPrice = thisCart.subtotalPrice + thisCart.deliveryFee;
      console.log('thisCart.totalNumber', thisCart.totalNumber);
      console.log('thisCart.subtotalPrice', thisCart.subtotalPrice);
      console.log('thisCart.totalPrice', thisCart.totalPrice);

      for (let key of thisCart.renderTotalsKeys) {
        for (let elem of thisCart.dom[key]) {
          elem.innerHTML = thisCart[key];
        }
      }
    }

    remove(cartProduct) {
      const thisCart = this;
      const index = thisCart.products.indexOf(cartProduct);

      // remove cartProduct from thisCart.products
      thisCart.products.splice(index, 1);

      // remove cartProduct from DOM
      cartProduct.dom.wrapper.remove();

      // call update to count prices once again
      thisCart.update();
    }
  }


  class CartProduct {
    constructor(menuProduct, element) {
      const thisCartProduct = this;

      thisCartProduct.id = menuProduct.id;
      thisCartProduct.name = menuProduct.name;
      thisCartProduct.price = menuProduct.price;
      thisCartProduct.priceSingle = menuProduct.priceSingle;
      thisCartProduct.amount = menuProduct.amount;

      thisCartProduct.params = JSON.parse(JSON.stringify(menuProduct.params));

      thisCartProduct.getElements(element);
      thisCartProduct.initAmountWidget();
      thisCartProduct.initActions();

      // console.log('new CartProduct', thisCartProduct);
      // console.log('productData', menuProduct);
    }

    getElements(element) {
      const thisCartProduct = this;
      thisCartProduct.dom = {};

      thisCartProduct.dom.wrapper = element;
      thisCartProduct.dom.amountWidget = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.amountWidget
      );
      thisCartProduct.dom.price = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.price
      );
      thisCartProduct.dom.edit = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.edit
      );
      thisCartProduct.dom.remove = thisCartProduct.dom.wrapper.querySelector(
        select.cartProduct.remove
      );
    }

    initAmountWidget() {
      const thisCartProduct = this;
      thisCartProduct.amountWidget = new AmountWidget(thisCartProduct.dom.amountWidget);

      thisCartProduct.dom.amountWidget.addEventListener('updated', function () {
        thisCartProduct.amount = thisCartProduct.amountWidget.value;
        thisCartProduct.price =
          thisCartProduct.priceSingle * thisCartProduct.amount;
        thisCartProduct.dom.price.innerHTML = thisCartProduct.price;
      });
    }

    remove() {
      const thisCartProduct = this;

      const event = new CustomEvent('remove', {
        bubbles: true,
        detail: {
          cartProduct: thisCartProduct,
        },
      });
      thisCartProduct.dom.wrapper.dispatchEvent(event);
    }

    initActions() {
      const thisCartProduct = this;

      thisCartProduct.dom.edit.addEventListener('click', function (event) {
        event.preventDefault();
      });

      thisCartProduct.dom.remove.addEventListener('click', function (event) {
        event.preventDefault();
        thisCartProduct.remove();
        console.log('remove');
      });
    }

  }

  const app = {
    //metoda pobierania danych z dataSource

    initData: function () {
      const thisApp = this;

      thisApp.data = dataSource;

    },

    initMenu: function () {

      const thisApp = this;
      // console.log('thisApp.data:', thisApp.data);

      for (let productData in thisApp.data.products) {
        new Product(productData, thisApp.data.products[productData]);
      }
    },

    initCart: function () {
      const thisApp = this;

      const cartElement = document.querySelector(select.containerOf.cart);
      thisApp.cart = new Cart(cartElement);
    },

    init: function () {
      const thisApp = this;
      // console.log('*** App starting ***');
      // console.log('thisApp:', thisApp);
      // console.log('classNames:', classNames);
      // console.log('settings:', settings);
      // console.log('templates:', templates);


      thisApp.initData();
      thisApp.initMenu();
      thisApp.initCart();
    },
  };

  app.init();
}


