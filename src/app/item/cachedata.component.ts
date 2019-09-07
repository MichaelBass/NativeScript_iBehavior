import { Component, OnInit, Input, Inject, ViewChild, ElementRef} from "@angular/core";
import { getString, setString, hasKey} from "tns-core-modules/application-settings";
import { Studyform } from './studyform';
import { ItemService } from "./item.service";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { Observable } from "rxjs/Observable";
import { DataStructure } from './datastructure';
import { UserModel } from './user';
import { LooseObject } from './looseobject';
import { CacheService } from "./cache.service";
import { EventData } from "tns-core-modules/data/observable";
import { Button } from "tns-core-modules/ui/button";  

@Component({
    selector: "ns-cachedata",
    moduleId: module.id,
    templateUrl: "./cachedata.component.html",
    styleUrls:["./cachedata.css"]
})


export class CacheDataComponent implements OnInit {

    @ViewChild("content") contentView: ElementRef;

    data: DataStructure[];
    user : UserModel;
    forms: Array<Studyform> = [];

    constructor(private itemService: ItemService, private cacheService: CacheService) { }

    ngOnInit(): void {

        if(hasKey("ActiveUser")){
           this.user = JSON.parse(getString("ActiveUser"));
        }

        if(hasKey("studyForms")){
            this.forms = JSON.parse(getString("studyForms"));
        }

        this.getData();
    }

    saveCacheData(args: EventData){
        let button = <Button>args.object;
    
        var myPackage = JSON.parse(getString("cacheResponse"));
        var _foundData = myPackage.find( function (obj){
           return button.id === obj.record_id + obj.redcap_repeat_instrument + obj.redcap_repeat_instance
        });

        if (typeof _foundData  !== 'undefined'){
            
            this.cacheService.uploadCachedData(_foundData).subscribe(
                () => {
                    this.getData();
                    this.contentView.nativeElement.refresh();
                }
            );
        }
    }

    getData(): void {

        this.data = [];

        var myPackage = JSON.parse(getString("cacheResponse"));
        for(var i=0; i < myPackage.length; i++){
            var assessment = new DataStructure();
            assessment.record_id = myPackage[i].record_id;
            assessment.redcap_repeat_instrument = myPackage[i].redcap_repeat_instrument;
            assessment.redcap_repeat_instance = myPackage[i].redcap_repeat_instance;
            assessment.results = [];
            for (var key in myPackage[i]) {
                if (myPackage[i].hasOwnProperty(key)) {
                    var obj = new LooseObject;
                    obj.key = key;
                    obj.value = myPackage[i][key];
                    assessment.results.push(obj);
                }
            }

            this.data.push(assessment)

        }

    }

}
