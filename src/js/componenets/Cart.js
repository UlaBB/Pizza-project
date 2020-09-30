
import { templates, select, settings } from '../settings.js';
import { utils } from '../utils.js';
import { CartProduct } from './CartProduct.js';

export class Cart {
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
    thisCart.dom.form = thisCart.dom.wrapper.querySelector(select.cart.form);
    thisCart.dom.phone = thisCart.dom.wrapper.querySelector(select.cart.phone);
    thisCart.dom.address = thisCart.dom.wrapper.querySelector(select.cart.address);

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

    thisCart.dom.form.addEventListener('submit', function (event) {
      event.preventDefault();
      thisCart.sendOrder();
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

  sendOrder() {
    const thisCart = this;
    const url = settings.db.url + '/' + settings.db.order;

    const payload = {
      totalPrice: thisCart.totalPrice,
      phone: thisCart.dom.phone.value,
      address: thisCart.dom.address.value,
      totalNumber: thisCart.totalNumber,
      subtotalPrice: thisCart.subtotalPrice,
      deliveryFee: thisCart.deliveryFee,
      products: [],
    };


    for (let product of thisCart.products) {
      thisCart.getData(product);
      payload.products.push(thisCart.getData(product));
    }


    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    };

    fetch(url, options)
      .then(function (response) {
        return response.json();
      }).then(function (parsedResponse) {
        console.log('parsedResponse', parsedResponse);
      });
  }

  getData(product) {

    const productObject = {};

    productObject.id = product.id;
    productObject.amount = product.amount;
    productObject.price = product.price;
    productObject.priceSingle = product.priceSingle;
    productObject.params = product.params;

    return productObject;
    //console.log(productObject);
  }
}
