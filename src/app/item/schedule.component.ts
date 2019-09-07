import { Component, OnInit, Inject} from "@angular/core";
import {Router} from "@angular/router";
import { CalendarService } from "./calendar.service";
import {RadCalendar} from "nativescript-ui-calendar";
import {CalendarEvent} from "nativescript-ui-calendar";
import {CalendarSelectionEventData} from "nativescript-ui-calendar";

import { NativeScriptUICalendarModule } from "nativescript-ui-calendar/angular";

@Component({
    selector: "ns-schedule",
    moduleId: module.id,
    templateUrl: "./schedule.component.html",
    styleUrls:["./schedule.css"]
})

export class ScheduleComponent implements OnInit{
    
    myCalendar : NativeScriptUICalendarModule;
    private _events: Array<CalendarEvent>;
    private _listItems: Array<CalendarEvent>;

    constructor(private _calendarService: CalendarService) {
    }

    get eventSource() {
        return this._events;
    }

    get myItems(): Array<CalendarEvent> {
        return this._listItems;
    }

    set myItems(value) {
        this._listItems = value;
    }

    ngOnInit() {
        this._events = this._calendarService.getCalendarEvents();
    }

    onDateSelected(args: CalendarSelectionEventData) {
        const calendar: RadCalendar = args.object;
        const date: Date = args.date;
        const events: Array<CalendarEvent> = calendar.getEventsForDate(date);
        this.myItems = events;
    }

}