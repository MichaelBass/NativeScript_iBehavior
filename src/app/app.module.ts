import { NgModule, NO_ERRORS_SCHEMA } from "@angular/core";
import { NativeScriptModule } from "nativescript-angular/nativescript.module";
import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";

import { ItemsComponent } from "./item/items.component";
import { ItemDetailComponent } from "./item/item-detail.component";
import { ItemDetail2Component } from "./item/item-detail2.component";
import { SituationComponent } from "./item/situation.component";
import { SplashScreenComponent } from "./item/splashscreen.component";
import { UsersComponent } from "./item/users.component";
import { DataComponent } from "./item/data.component";
import { ScheduleComponent } from "./item/schedule.component";
import { HintComponent } from "./item/hints.component";

import { ItemService } from "./item/item.service";
import { CacheService } from "./item/cache.service";
import { CalendarService } from "./item/calendar.service";
import { CacheDataComponent } from "./item/cachedata.component";

import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { NativeScriptUIListViewModule } from "nativescript-ui-listview/angular";
import { NativeScriptUICalendarModule } from "nativescript-ui-calendar/angular";


// Uncomment and add to NgModule imports if you need to use two-way binding
import { NativeScriptFormsModule } from "nativescript-angular/forms";

// Uncomment and add to NgModule imports if you need to use the HttpClient wrapper
import { NativeScriptHttpClientModule } from "nativescript-angular/http-client";

@NgModule({
    bootstrap: [
        AppComponent
    ],
    imports: [
        NativeScriptModule,
        NativeScriptFormsModule,
        NativeScriptUICalendarModule,
        NativeScriptUIListViewModule,
        ReactiveFormsModule,
        HttpClientModule,       
        AppRoutingModule
    ],
    declarations: [
        AppComponent,
        ItemsComponent,
        ItemDetailComponent,
        ItemDetail2Component,
        SituationComponent,
        HintComponent,
        SplashScreenComponent,
        UsersComponent,
        DataComponent,
        CacheDataComponent,
        ScheduleComponent       
    ],
    providers: [
        ItemService,
        CacheService,
        CalendarService,
    ],
    schemas: [
        NO_ERRORS_SCHEMA
    ]
})
/*
Pass your application module to the bootstrapModule function located in main.ts to start your app
*/
export class AppModule { }
