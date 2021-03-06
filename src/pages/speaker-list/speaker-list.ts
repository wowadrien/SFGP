import { Component } from '@angular/core';

import { ActionSheet, ActionSheetController, Config, NavController } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';

import { ConferenceData } from '../../providers/conference-data';

@Component({
  selector: 'page-speaker-list',
  templateUrl: 'speaker-list.html'
})
export class SpeakerListPage {
  actionSheet: ActionSheet;
  private speakers: any; 

  constructor(
    public actionSheetCtrl: ActionSheetController,
    public navCtrl: NavController,
    public confData: ConferenceData,
    public config: Config,
    public inAppBrowser: InAppBrowser
  ) { }

  ionViewDidLoad() {
    this.confData.getSpeakers().subscribe((speakers: any[]) => {
      this.speakers = speakers;  
    });
  }

  
  getSpeaker(ev: any) {
    // Reset items back to all of the items
    this.ionViewDidLoad();

    // set val to the value of the searchbar
    let val = ev.target.value;

    // if the value is an empty string don't filter the items
    if (val && val.trim() != '') {
      this.speakers = this.speakers.filter((speaker : any) => {
        return (speaker.name.toLowerCase().indexOf(val.toLowerCase()) > -1 || speaker.description.toLowerCase().indexOf(val.toLowerCase()) > -1 || speaker.tracks[0].toLowerCase().indexOf(val.toLowerCase()) > -1 );
      })
    }
  }
  
  openContact(speaker: any) {
    let mode = this.config.get('mode');

    let actionSheet = this.actionSheetCtrl.create({
      title: 'Contacter ' + speaker.name,
      buttons: [
        {
          text: `${speaker.email} `,
          icon: mode !== 'ios' ? 'mail' : null,
          handler: () => {
            window.open('mailto:' + speaker.email);
          }
        }
      ]
    });

    actionSheet.present();
  }
}
