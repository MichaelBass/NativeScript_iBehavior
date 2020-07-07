import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "nativescript-angular/directives/dialogs";
import { LooseObject } from './looseobject';
import { Page } from 'tns-core-modules/ui/page';
import { ListView } from "tns-core-modules/ui/list-view";


@Component({
    selector: "my-hint",
    moduleId: module.id,
    templateUrl: "./hints.component.html",
    styleUrls:["./hints.css"]
})
export class HintComponent implements OnInit {


    //  need to change template and style for ios by changing path to ./item/hint.html, etc.
	public hints: Array<LooseObject>;
    public title: string;

    private answer: string;

    public constructor(private params: ModalDialogParams, private page: Page) { 
    	this.hints = params.context.code;
        this.title = params.context.title;
    }

    ngOnInit(): void { 
       // var lv = this.page.getViewById("content");   
       // lv.android.setFastScrollAlwaysVisible(true);
    }

    onSelectResponse(args){
        this.answer = args;
        this.params.closeCallback(this.answer);
    }

    public close(res: string) {
        if(typeof res == 'undefined'){
            this.answer="";
        }
        this.params.closeCallback(this.answer);
    }

}