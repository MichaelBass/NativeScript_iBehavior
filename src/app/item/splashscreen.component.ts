import { Component, OnInit, DoCheck} from "@angular/core";
import {Router} from "@angular/router";
import {RouterExtensions} from "nativescript-angular/router";
import { ItemService } from "./item.service";
import { CacheService } from "./cache.service";
import { getString, setString, hasKey} from "tns-core-modules/application-settings";
import * as connectivity from "tns-core-modules/connectivity";
import { isAndroid, isIOS, device, screen } from "tns-core-modules/platform";
//const platformModule = require("tns-core-modules/platform");
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Config } from "./config";
import { REDCap } from "./redcap";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserModel } from './user';

import { EventData } from "tns-core-modules/data/observable";

@Component({
    selector: "ns-splashscreen",
    moduleId: module.id,
    templateUrl: "./splashscreen.component.html",
    styleUrls:["./splashscreen-common.css","./splashscreen.css"]
})
export class SplashScreenComponent implements OnInit, DoCheck{
    
    instructions: string;
    server: string;

    redcap: REDCap;
    redcapColor: string;
    activeREDCap: string;

    user : UserModel;
    userColor : string;
    activeuser: string;
    currentUser: string;

    constructor(private itemService: ItemService, private router: Router, private http: HttpClient, private cacheService: CacheService, private routerExtensions: RouterExtensions) {

    }

    ngDoCheck(): void {
        this.instructions = "Welcome to iBehavior, there are a few things that you need to do before we begin:"


        if(!hasKey("server")){
            this.server = "You will need to specify where your data will be sent. Click on the Settings and click the Download button to enter the study code that you were provided.  If you do not have a study code enter 'test'."
            this.redcapColor = "red";
            
        }else{
            this.server = "";
            this.redcap = JSON.parse(getString("server"));
            this.redcapColor = "green";
            this.activeREDCap = this.redcap.name;
        }

        if(!hasKey("ActiveUser")){
            this.activeuser = "You will need to set a user as active. Click on the Mange User and either create or select an user and make him/her active."
            this.userColor = "red";
        }else{
            this.activeuser = "";
            this.user = JSON.parse(getString("ActiveUser"));
            this.currentUser = this.user.name;
            this.userColor = "green";
        }

    }

    ngOnInit(): void {

        this.redcap = new REDCap();
        this.redcap.name = "";
        this.redcap.url = "";
        this.redcap.token = "";
    }

    onResetCache(args){
        this.cacheService.resetCache();
    }

    onViewCache(args){
        let options = {
            title: "cache",
            message: getString("cacheResponse"),
            okButtonText: "OK"
        };
        alert(options);
    }

    onHelp(args){

        var _user = "";
        if(hasKey("ActiveUser")){
            _user = "\r[user:: " + this.currentUser + "]";
        }

        var _db = "";
        if(hasKey("server")){
            _db = "\r[study code:: " + this.redcap.name + "]";
        }

        var _version = "\riOS::1.0.5  android::1.0.6";



        if(! hasKey("cacheResponse") ){
            setString("cacheResponse", "[]");
        }

        var myCache = JSON.parse(getString("cacheResponse"));
        var cacheLength = 0;
        if(myCache){
            cacheLength = myCache.length;
        }
        var _cache = "\r cached data:: " + cacheLength + " records";


        var _connectivity = "";
        let connectionType = connectivity.getConnectionType();
        switch (connectionType) {
            case connectivity.connectionType.none:
                //console.log("connectionType: None");
                _connectivity = "\rConnectivity::None";
                break;
            case connectivity.connectionType.wifi:
                //console.log("connectionType: Wi-Fi");
                _connectivity = "\rConnectivity::Wi-Fi";
                break;
            case connectivity.connectionType.mobile:
                //console.log("connectionType: Mobile");
                _connectivity = "\rConnectivity::Mobile";
                break;
            default:
                //console.log("connectionType: default?");
                break;
        }

        dialogs.action("More information coming soon." + _user + _db + _version + _connectivity + _cache, "Close", ["Clear cache", "View cache"]).then(result => {
            if(result == "Clear cache"){
                this.cacheService.resetCache();
            }
            if(result == "View cache"){

                this.routerExtensions.navigate(["/cachedata"], {
                transition: {
                    name: "fade",
                    duration: 800,
                    curve: "linear"
                }
                });

            }
        });



    }

    onSettings(args){

        dialogs.prompt({
        title: "Configuration",
        message: "Please enter your study code",
        okButtonText: "Done",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text
        }).then(r => {

            if(r.result){
                this.http.get<any>(Config.server + "/iBehavior/Config/" + r.text ).subscribe(
                fields => {
                    //console.log(fields);
                    this.redcap.name = fields[0].NAME;
                    this.redcap.assessment_time = fields[1].ASSESSMENT_TIME;
                    this.redcap.url = fields[2].URL;
                    this.redcap.token = fields[3].TOKEN;
                    

                    setString("server", JSON.stringify( this.redcap ));
                },
                error => console.log(error.message));
            }
        });

    }

}