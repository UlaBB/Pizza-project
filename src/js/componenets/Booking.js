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
  }

  initWidgets() {
    const thisBooking = this;

    thisBooking.peopleAmount = new AmountWidget(thisBooking.dom.peopleAmount);
    thisBooking.hoursAmount = new AmountWidget(thisBooking.dom.hoursAmount);
    thisBooking.datePicker = new DatePicker(thisBooking.dom.datePicker);
    thisBooking.hourPicker = new HourPicker(thisBooking.dom.hourPicker);
    thisBooking.tableID = [];

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
    console.log('thisBooking.booked', thisBooking.booked);

    console.log('eventsCurrent:', eventsCurrent);

    for (let event of eventsCurrent) {
      console.log('event:', event);

      thisBooking.makeBooked(
        event.date,
        event.hour,
        event.duration,
        event.table
      );
    }

    for (let item of bookings) {
      console.log('bookings item:', item);

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

  // updateDOM() {
  //   const thisBooking = this;

  //   thisBooking.date = thisBooking.datePicker.value;
  //   console.log('thisBooking.dataPicker.value:', thisBooking.datePicker.value);

  //   thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);
  //   console.log('thisBooking.hour:', thisBooking.hour);


  //   for (let table of thisBooking.dom.tables) {
  //     let tableID = table.getAttribute(settings.booking.tableIdAttribute);
  //     tableID = parseInt(tableID);
  //     console.log(tableID);

  //     table.classList.remove(classNames.booking.tableSelected);

  //     if (thisBooking.booked[thisBooking.date] &&
  //       thisBooking.booked[thisBooking.date][thisBooking.hour]
  //       && thisBooking.booked[thisBooking.date].includes(tableID)) {
  //       table.classList.add(classNames.booking.tableBooked);
  //     }
  //     else {
  //       table.classList.remove(classNames.booking.tableBooked);
  //     }
  //   }
  // }

  updateDOM() {
    const thisBooking = this;

    thisBooking.date = thisBooking.datePicker.value;
    thisBooking.hour = utils.hourToNumber(thisBooking.hourPicker.value);

    let allAvailable = false;// pomocnicza zmienna

    if (
      typeof thisBooking.booked[thisBooking.date] == 'undefined' ||
      typeof thisBooking.booked[thisBooking.date][thisBooking.hour] ==
      'undefined'
    ) {
      allAvailable = true;
    }

    for (let table of thisBooking.dom.tables) {
      const tableNumber = table.getAttribute(settings.booking.tableIdAttribute);
      const tableID = parseInt(tableNumber);
      // console.log(tableID);

      if (
        !allAvailable &&
        thisBooking.booked[thisBooking.date][thisBooking.hour].includes(tableID)
      ) {
        table.classList.add(classNames.booking.tableBooked);
        table.classList.remove('selected');
      } else {
        table.classList.remove(classNames.booking.tableBooked, 'selected');
      }
    }
  }
}