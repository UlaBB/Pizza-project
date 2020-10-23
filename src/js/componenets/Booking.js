import { AmountWidget } from './AmountWidget.js';
import { select, templates, settings, classNames } from '../settings.js';
import { DatePicker } from './DatePicker.js';
import { HourPicker } from './HourPicker.js';
import { utils } from '../utils.js';



export class Booking {
  constructor(widgetContainer) {
    const thisBooking = this;

    thisBooking.render(widgetContainer);
    thisBooking.initWidgets();
    thisBooking.getData();
    thisBooking.selectTable();
    thisBooking.initActions();
  }

  render(widgetContainer) {
    const thisBooking = this;

    const generatedHTML = templates.bookingWidget();

    thisBooking.dom = {};
    thisBooking.dom.wrapper = widgetContainer;
    thisBooking.dom.wrapper.innerHTML = generatedHTML;
    thisBooking.dom.peopleAmount = thisBooking.dom.wrapper.querySelector(select.booking.peopleAmount);
    thisBooking.dom.hoursAmount = thisBooking.dom.wrapper.querySelector(select.booking.hoursAmount);
    thisBooking.dom.datePicker = thisBooking.dom.wrapper.querySelector(select.widgets.datePicker.wrapper);
    thisBooking.dom.hourPicker = thisBooking.dom.wrapper.querySelector(select.widgets.hourPicker.wrapper);
    thisBooking.dom.tables = thisBooking.dom.wrapper.querySelectorAll(select.booking.tables);
    thisBooking.dom.starters = thisBooking.dom.wrapper.querySelectorAll(select.booking.starters);
    thisBooking.dom.phone = thisBooking.dom.wrapper.querySelector(select.booking.phone);
    thisBooking.dom.address = thisBooking.dom.wrapper.querySelector(select.booking.address);
    thisBooking.dom.form = thisBooking.dom.wrapper.querySelector(select.booking.form);
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount, 1);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount, 0.5);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);

    thisBooking.dom.wrapper.addEventListener('updated', function () {
      thisBooking.updateDOM();
    });

  }

  getData() {
    const thisBooking = this;

    const startEndDates = {};
    startEndDates[settings.db.dateStartParamKey] = utils.dateToStr(thisBooking.datePicker.minDate);
    startEndDates[settings.db.dateEndParamKey] = utils.dateToStr(thisBooking.datePicker.maxDate);

    const endDate = {};
    endDate[settings.db.dateEndParamKey] = startEndDates[settings.db.dateEndParamKey];

    const params = {
      booking: utils.queryParams(startEndDates),
      eventsCurrent: settings.db.notRepeatParam + '&' + utils.queryParams(startEndDates),
      eventsRepeat: settings.db.repeatParam + '&' + utils.queryParams(endDate),
    };

    // console.log('getData params', params);

    const urls = {
      booking: settings.db.url + '/' + settings.db.booking + '?' + params.booking,
      eventsCurrent: settings.db.url + '/' + settings.db.event + '?' + params.eventsCurrent,
      eventsRepeat: settings.db.url + '/' + settings.db.event + '?' + params.eventsRepeat,
    };

    // console.log('getData urls', urls);

    Promise.all([
      fetch(urls.booking),
      fetch(urls.eventsCurrent),
      fetch(urls.eventsRepeat),
    ])
      .then(function ([bookingsResponse, eventsCurrentResponse, eventsRepeatResponse]) {
        return Promise.all([
          bookingsResponse.json(),
          eventsCurrentResponse.json(),
          eventsRepeatResponse.json(),
        ]);
      })
      .then(function ([bookings, eventsCurrent, eventsRepeat]) {
        thisBooking.parseData(bookings, eventsCurrent, eventsRepeat);
      });
  }

  parseData(bookings, eventsCurrent, eventsRepeat) {
    const thisBooking = this;

    thisBooking.booked = {};// pusty obiekt
    // console.log('thisBooking.booked', thisBooking.booked);

    // console.log('eventsCurrent:', eventsCurrent);

    for (let event of eventsCurrent) {
      // console.log('event:', event);

      thisBooking.makeBooked(
        event.date,
        event.hour,
        event.duration,
        event.table
      );
    }

    for (let item of bookings) {
      // console.log('bookings item:', item);

      thisBooking.makeBooked(item.date, item.hour, item.duration, item.table);
    }

    for (let repEvent of eventsRepeat) {

      if (repEvent.repeat == 'daily') {
        const eventDateParse = new Date(repEvent.date);
        const maxDate = utils.addDays(repEvent.date, 14);

        for (let loopDate = eventDateParse; loopDate <= maxDate; loopDate = utils.addDays(loopDate, 1)) {
          thisBooking.makeBooked(
            utils.dateToStr(loopDate),
            repEvent.hour,
            repEvent.duration,
            repEvent.table
          );
        }
      }
    }
    thisBooking.updateDOM();
  }


  makeBooked(date, hour, duration, table) {
    const thisBooking = this;

    if (typeof thisBooking.booked[date] == 'undefined') {
      thisBooking.booked[date] = {};
    }

    const startHour = utils.hourToNumber(hour);

    for (let hourBlock = startHour; hourBlock < startHour + duration; hourBlock += 0.5) {
      if (typeof thisBooking.booked[date][hourBlock] == 'undefined') {
        thisBooking.booked[date][hourBlock] = [];
      }
      thisBooking.booked[date][hourBlock].push(table);
    }
  }




  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] == 'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      let tableId = table.getAttribute(settings.booking.tableIdAttribute);
      if (!isNaN(tableId)) {
        tableId = parseInt(tableId);
      }

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableId)
      ) {
        table.classList.add(classNames.booking.tableBooked);
      } else {
        table.classList.remove(classNames.booking.tableBooked);
        table.classList.remove('reserved');
      }
    }

  }



  selectTable() {
    const thisBooking = this;

    for (let table of thisBooking.dom.tables) {

      table.addEventListener('click', function (event) {
        event.preventDefault();

        if (table.classList.contains('booked')) {
          alert('Table not available.');


        } else {
          thisBooking.removeSelected();
          table.classList.add(classNames.booking.tableSelected);
          console.log('Choose hour and date of booking!');
          const tableNumber = table.getAttribute(settings.booking.tableIdAttribute);
          thisBooking.bookedTable = parseInt(tableNumber);
        }
      });
    }
  }

  removeSelected() {
    const thisBooking = this;

    const selectedTables = document.querySelectorAll('.selected');
    for (let selected of selectedTables) {
      selected.classList.remove('selected');
    }
    delete thisBooking.bookedTable;
  }


  initActions() {
    const thisBooking = this;
    const formSubmit = document.querySelector('form.booking-form');
    formSubmit.addEventListener('submit', function (event) {
      event.preventDefault();
      thisBooking.sendOrder();
    });

    thisBooking.dom.hourPicker.addEventListener('updated', function () {
      thisBooking.removeSelected();
    });


    thisBooking.dom.datePicker.addEventListener('updated', function () {
      thisBooking.removeSelected();
    });

  }


  sendOrder() {
    const thisBooking = this;
    const url = settings.db.url + '/' + settings.db.booking;
    const payload = {
      starters: [],
      date: thisBooking.datePicker.value,
      people: thisBooking.peopleAmount.value,
      hour: thisBooking.hourPicker.value,
      duration: thisBooking.hoursAmount.value,
      table: thisBooking.bookedTable,
    };
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
        console.log('parseRespond', parsedResponse);

        thisBooking.makeBooked(parsedResponse.date, parsedResponse.hour, parsedResponse.duration, parsedResponse.table);
        thisBooking.removeSelected();
        thisBooking.updateDOM();
      });


  }

}
