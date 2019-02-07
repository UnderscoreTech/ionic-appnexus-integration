import { Component, ElementRef, HostListener, Input, Renderer2 } from '@angular/core';
import { Platform, NavController } from 'ionic-angular';
import { stringify } from 'qs';
import postscribe from 'postscribe';
declare var androidIDFA: any;


let options = {
  beforeWriteToken: function (token) {
      if (token.src && token.src.substr(0, 2) == '//') {
          token.src = 'https:' + token.src;
      }
      return token;
  },
  error: function (err) {
      console.log('postscribe error', err);
  }
};

@Component({
  selector: 'page-home',
  templateUrl: 'home.html',
  providers: []
})
export class HomePage {
  @Input('src') src: string = '';
  @Input('iframe') iframe: boolean = true;
  @Input('name') name: string = '';
  hasIdfa: boolean = true;
  hasInited: boolean = false;
  iframeEl: any;

  constructor(public navCtrl: NavController,
              private el: ElementRef,
              private renderer: Renderer2,
              private platform: Platform
              ) {

  }

  ngOnInit() {
    let bundle = 'nl.voetbalprimeur';
    if (this.platform.is('android')) {
        bundle = 'nl.d_tt.vp';
    }

    let queryParameters = {
      id: 14516583,
      size: '300x250',
      appid: bundle,
      ua: window.navigator.userAgent,
      // devmake: '',
      // devmodel: '',
      devtime: + new Date(),
      devtz: 'Europe/Amsterdam',
      language: 'nl',
      max_size: '300x250',
      orientation: 'v',
      //istest: '',
    };
    
    console.log("APNXS Query parameters", queryParameters);
    this.src = 'https://ib.adnxs.com/mob?' + stringify(queryParameters);
    console.log("APNXS Full src", this.src);
  }

  ngAfterViewInit() {
    if (!this.src) {
      console.log('Tried rendering an ad without the src attribute');
      return
    }

    this.hasInited = true;
    this.runPostscribe();
  }

  runPostscribe() {
    if (!this.hasIdfa || !this.hasInited) {
      return;
    }

    if (this.iframe) {
      let el = this.el.nativeElement.querySelector('.ad');
      console.log("EL", el, el.nativeElement)

      this.iframeEl = this.renderer.createElement('iframe');
      this.iframeEl.width = 300;
      this.iframeEl.height = 250;
      this.iframeEl.frameBorder = 0;
      this.iframeEl.src = 'http://iframe-ads-app.voetbalprimeur.nl/ads.html?src=' + encodeURIComponent(this.src);
      console.log("Iframe url", this.iframeEl.src);
      this.renderer.appendChild(this.el.nativeElement.querySelector('.ad'), this.iframeEl);
      this.renderer.setStyle(this.el.nativeElement, 'text-align', 'center');
      this.renderer.setStyle(this.el.nativeElement, 'display', 'block');
      return;
    }

    let script = `<script src="${this.src}"></script>`;
    postscribe(this.el.nativeElement.querySelector('.ad'), script, options);
  }

  onIdfaCallback(result) {
    let idfa = result.adId || result.idfa;
    this.src = this.src.replace('{IDFA}', idfa);
    this.src = this.src.replace('{GDPR}', '1');
    this.hasIdfa = true;
    this.runPostscribe();
  }

  onIdfaError(err) {
    console.log('idfa error, removing IDFA from url', err);
    this.src = this.src.replace('&idfa={IDFA}', '');
    this.src = this.src.replace('{GDPR}', '0');
    this.hasIdfa = true;
    this.runPostscribe();
  }

  @HostListener('window:message', ['$event'])
  onIframeMessage(event) {
      if (event.data === 'close' && this.iframeEl && event.source === this.iframeEl.contentWindow) {
          this.renderer.removeChild(this.el.nativeElement, this.iframeEl);
      }
  }

}
