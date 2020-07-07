import {Component, OnInit, Input, ChangeDetectionStrategy, Inject} from "@angular/core";

import { SegmentedBar, SegmentedBarItem, SelectedIndexChangedEventData } from "tns-core-modules/ui/segmented-bar";
import { Page } from 'tns-core-modules/ui/page';
import { ActivatedRoute } from "@angular/router";
import { TextView } from "tns-core-modules/ui/text-view";
import { TextField } from "tns-core-modules/ui/text-field";
import { ListView } from "tns-core-modules/ui/list-view";
import { Switch } from "tns-core-modules/ui/switch";
import * as LabelModule from "tns-core-modules/ui/label";
import { getString, setString, remove, hasKey} from "tns-core-modules/application-settings";
import { ItemService } from "./item.service";
import { device } from "tns-core-modules/platform";
import { Observable } from "rxjs/Observable";

import * as dialogs from "tns-core-modules/ui/dialogs";
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { UserModel } from './user';
import { Window } from './window';
import { RedcapWindow } from './redcapwindow';



import { Config } from "./config";
import { REDCap } from "./redcap";

interface LooseObject2 {
    [key: string]: any
}

@Component({
    selector: "ns-window",
    moduleId: module.id,
    templateUrl: "./window.component.html",
    styleUrls:["./window.css"],
    changeDetection: ChangeDetectionStrategy.OnPush
})

export class WindowComponent implements OnInit {

    public windows: Array<Window>;
    public redcap_windows: Array<RedcapWindow>;
    public userName : string;
    public editState = true;
    currentuser : UserModel;

    redcap: REDCap;
    activeREDCap: string;
    record_id: string;
    days: Array<SegmentedBarItem> = [];

    constructor(private page: Page, private itemService: ItemService, private http: HttpClient, private route: ActivatedRoute) {
            const sun = new SegmentedBarItem();
            sun.title = "Sun.";
            this.days.push(sun);

            const mon = new SegmentedBarItem();
            mon.title = "Mon.";
            this.days.push(mon);

            const tues = new SegmentedBarItem();
            tues.title = "Tues.";
            this.days.push(tues);
 
            const wed = new SegmentedBarItem();
            wed.title = "Wed.";
            this.days.push(wed);

            const thurs = new SegmentedBarItem();
            thurs.title = "Thurs.";
            this.days.push(thurs);

            const fri = new SegmentedBarItem();
            fri.title = "Fri.";
            this.days.push(fri);

            const sat = new SegmentedBarItem();
            sat.title = "Sat.";
            this.days.push(sat);
     }

    ngOnInit(): void {
      this.record_id = this.route.snapshot.params["record_id"];
      this.getWindow();
    }

    getWindow(){
        this.windows =[];
        this.itemService.getWindowByRecordID( this.record_id ).subscribe(
          fields => {

            this.redcap_windows = fields;

            fields.forEach(window => {
              this.processWindow(window);
            });

            this.windows.sort(this.compare);
            let lst = <ListView>this.page.getViewById('lstWindows');
            lst.refresh();
          }
        );
    }

    processWindow(window:RedcapWindow){
      switch (window.redcap_repeat_instrument) {
        case "xx_sunday":
          const sun_window = new Window();
          sun_window.record_id = window.record_id;
          sun_window.day = "Sunday";
          sun_window.instance = window.redcap_repeat_instance;
          sun_window.start = window.time_start_sun;
          sun_window.end = window.time_end_sun;
          sun_window.order = 1;
          this.windows.push(sun_window);
          break;
        case "xx_monday":
          const mon_window = new Window();
          mon_window.record_id = window.record_id;
          mon_window.day = "Monday";
          mon_window.instance = window.redcap_repeat_instance;
          mon_window.start = window.time_start_mon;
          mon_window.end = window.time_end_mon;
          mon_window.order = 2;
          this.windows.push(mon_window);
          break;
        case "xx_tuesday":
          const tue_window = new Window();
          tue_window.record_id = window.record_id;
          tue_window.day = "Tuesday";
          tue_window.instance = window.redcap_repeat_instance;
          tue_window.start = window.time_start_tue;
          tue_window.end = window.time_end_tue;
          tue_window.order = 3;
          this.windows.push(tue_window);
          break;
        case "xx_wednesday":
          const wed_window = new Window();
          wed_window.record_id = window.record_id;
          wed_window.day = "Wednesday";
          wed_window.instance = window.redcap_repeat_instance;
          wed_window.start = window.time_start_wed;
          wed_window.end = window.time_end_wed;
          wed_window.order = 4;
          this.windows.push(wed_window);
          break;
        case "xx_thursday":
          const thurs_window = new Window();
          thurs_window.record_id = window.record_id;
          thurs_window.day = "Thursday";
          thurs_window.instance = window.redcap_repeat_instance;
          thurs_window.start = window.time_start_thur;
          thurs_window.end = window.time_end_thur;
          thurs_window.order = 5;
          this.windows.push(thurs_window);
          break;
        case "xx_friday":
          const fri_window = new Window();
          fri_window.record_id = window.record_id;
          fri_window.day = "Friday";
          fri_window.instance = window.redcap_repeat_instance;
          fri_window.start = window.time_start_fri;
          fri_window.end = window.time_end_fri;
          fri_window.order = 6;
          this.windows.push(fri_window);  
          break;
        case "xx_saturday":
          const sat_window = new Window();
          sat_window.record_id = window.record_id;
          sat_window.day = "Saturday";
          sat_window.instance = window.redcap_repeat_instance;
          sat_window.start = window.time_start_sat;
          sat_window.end = window.time_end_sat;
          sat_window.order = 7;
          this.windows.push(sat_window);
          break;              
        default:
      }
        
    }



    compare(a, b) {

      const dayA = a.order;
      const dayB = b.order;

      const timeA = parseInt(a.start.substring(0,2));
      const timeB = parseInt(b.start.substring(0,2));

      let comparison = 0;

      if (dayA > dayB) {
        comparison = 1;
      } else if (dayA < dayB) {
        comparison = -1;
      } else if (dayA == dayB && timeB > timeA) {
        comparison = -1;
      } else if (dayA == dayB && timeB < timeA) {
        comparison = 1;
      }


      return comparison;
    }

    compareInstance(a,b){

      const instanceA = a.redcap_repeat_instance;
      const instanceB = b.redcap_repeat_instance;

      let comparisonInstance = 0;

      if (instanceA > instanceB) {
        comparisonInstance = 1;
      } else if (instanceA < instanceB) {
        comparisonInstance = -1;
      }

      return comparisonInstance;

    }

    calculateInstance(instrument: string){

      let _windows = this.redcap_windows.filter((a) => a.redcap_repeat_instrument === instrument);
      let rtn = 1;

      if (_windows.length == 0 ){
          return rtn;
      }

      if (_windows.length == 1){
        rtn =  _windows[0].redcap_repeat_instance + 1;
      } else {
        _windows.sort(this.compareInstance);
        rtn = _windows[ _windows.length -1 ].redcap_repeat_instance + 1;

      }
      return rtn;
    }
    
    deleteWindow(){
      console.log("Delete");
    }

    updateWindow() {
      let start = <TextField>this.page.getViewById('txtStart');
      let end = <TextField>this.page.getViewById('txtEnd');
      let day = <SegmentedBar>this.page.getViewById('segDays');

      var timeRegex = /^[0-2][0-9]:00$/;
      if( !timeRegex.test(end.text) ){
          alert("end time format must be xx:00");
          return;
      }
      if( !timeRegex.test(start.text) ){
          alert("start time format must be xx:00");
          return;
      }

      var obj: LooseObject2 = {};
      obj.record_id = this.record_id;

      switch (day.selectedIndex) {
        case 0:
          obj["redcap_repeat_instrument"] = "xx_sunday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_sun"] = start.text;
          obj["time_end_sun"] = end.text;
          break;
        case 1:
          obj["redcap_repeat_instrument"] = "xx_monday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_mon"] = start.text;
          obj["time_end_mon"] = end.text;
          break;
        case 2:
          obj["redcap_repeat_instrument"] = "xx_tuesday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_tue"] = start.text;
          obj["time_end_tue"] = end.text;
          break;
        case 3:
          obj["redcap_repeat_instrument"] = "xx_wednesday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_wed"] = start.text;
          obj["time_end_wed"] = end.text;
          break;
        case 4:
          obj["redcap_repeat_instrument"] = "xx_thursday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_thur"] = start.text;
          obj["time_end_thur"] = end.text;
          break;
        case 5:
          obj["redcap_repeat_instrument"] = "xx_friday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_fri"] = start.text;
          obj["time_end_fri"] = end.text;
          break;
        case 6:
          obj["redcap_repeat_instrument"] = "xx_saturday";
          obj["redcap_repeat_instance"] = this.calculateInstance(obj["redcap_repeat_instrument"]);
          obj["time_start_sat"] = start.text;
          obj["time_end_sat"] = end.text;
          break;              
        default:
      }

      var myPackage =[];
      myPackage.push(obj);


      this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
          fields => {
              //if(fields.count == 1){

              this.windows =[];
              this.itemService.getWindowByRecordID( this.record_id ).subscribe(
                xxx => {

                  xxx.forEach(window => {
                    this.processWindow(window);
                  }); 
                  this.windows.sort(this.compare);

                  let lst = <ListView>this.page.getViewById('lstWindows');
                  lst.refresh();
                }
              ); 
              //}  
          }
      );



    }

}
