describe('ga_contextpopup_directive', function() {
  var elt, parentScope, handlers = {}, map, $rootScope, gaReframe, $window, $compile, $httpBackend, $timeout, gaWhat3Words, $q, gaPermalink;
  var expectedHeightUrl = '//api.geo.admin.ch/height?easting=661473&elevation_model=COMB&northing=188192';
  var expectedReframeUrl = '//api.example.com/reframe/lv03tolv95?easting=661473&northing=188192';
  var expectedw3wUrl = 'dummy.test.url.com/v2/reverse?coords=46.84203157398991,8.244528382656728&key=testkey&lang=de';
  var contextPermalink = 'http://test.com?X=188192&Y=661473';
  var crosshairPermalink = 'http://test.com?crosshair=marker&X=188192&Y=661473';

  var loadDirective = function() {
    parentScope = $rootScope.$new();
    var tpl = '<div ga-context-popup ga-context-popup-map="map" ga-context-popup-options="options"></div>';
    elt = $compile(tpl)(parentScope);
    $rootScope.$digest();
    scope = elt.isolateScope();
  };

  beforeEach(function() {

    module(function($provide) {
      $provide.value('gaBrowserSniffer', {
        msie: false,
        mobile: false,
        phone: false,
      });

      $provide.value('gaNetworkStatus', {
        offline: true
      });

      $provide.value('gaLang', {
        get: function() {
          return 'de';
        }
      });

      $provide.value('gaPermalink', {
        getHref: function(p) {
          if (p.crosshair) {
            return crosshairPermalink;
          }
          return contextPermalink;
        }
      });
    });

    inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      $window = $injector.get('$window');
      $compile = $injector.get('$compile');
      $timeout = $injector.get('$timeout');
      $httpBackend = $injector.get('$httpBackend');
      $q = $injector.get('$q');
      gaPermalink = $injector.get('gaPermalink');
      gaReframe = $injector.get('gaReframe');
      gaWhat3Words = $injector.get('gaWhat3Words');
    });

    $(document.body).append('<div id="map"></div>');
    map = new ol.Map({target: 'map'});
    map.on = function(eventType, handler) {
      handlers[eventType] = handler;
    };
    map.getEventPixel = function(event) { return [25, 50]; };
    map.getEventCoordinate = function(event) { return [661473, 188192]; };

    $rootScope.map = map;
    $rootScope.options = {
      heightUrl: '//api.geo.admin.ch/height',
      qrcodeUrl: '//api.geo.admin.ch/qrcodegenerator'
    };

    $httpBackend.when('GET', expectedHeightUrl).respond({height: '1233'});
    $httpBackend.when('GET', expectedReframeUrl).respond({coordinates: [2725984.4037894635, 1180787.4007025931]});
    $httpBackend.when('GET', expectedw3wUrl).respond({words: 'das.ist.test'});
  });

  afterEach(function() {
    $('#map').remove();
    $httpBackend.verifyNoOutstandingExpectation();
    $httpBackend.verifyNoOutstandingRequest();
  });

  describe('on all browser', function() {
    var mapEvt, mapEvt2, mouseEvt, mouseEvt2, touchEvt, touchEvt2;

    beforeEach(inject(function($injector) {
      mapEvt = {
         stopPropagation: function() {},
         preventDefault: function() {},
         pixel: [25, 50],
         coordinate: [661473, 188192]
      };
      mapEvt2 = {
        stopPropagation: function() {},
        preventDefault: function() {},
        pixel: [30, 60],
        coordinate: [661673, 198192]
      };
      mouseEvt = $.extend({type: 'mousedown'}, mapEvt),
      mouseEvt2 = $.extend({type: 'mouseup'}, mapEvt2),
      touchEvt = $.extend({type: 'touchstart'}, mapEvt),
      touchEvt2 = $.extend({type: 'touchend'}, mapEvt2);

      loadDirective();
    }));

    it('creates <table> and <td>\'s', function() {
      var tables = elt.find('div.popover-content table');
      var tds = $(tables[0]).find('td');
      expect(tables.length).to.be(1);
      expect(tds.length).to.be(16);
    });

    it('displays information on contextmenu events', function() {
      var spy = sinon.spy(gaReframe, 'get03To95');
      var spy2 = sinon.spy(gaWhat3Words, 'getWords');
      var evt = $.Event('contextmenu');
      evt.coordinate = [661473, 188192];
      evt.pixel = [25, 50];
      handlers.pointerdown(touchEvt);
      $(map.getViewport()).trigger(evt);
      $httpBackend.flush();

      expect(spy.callCount).to.eql(1);
      expect(spy2.callCount).to.eql(1);

      var tables = elt.find('div.popover-content table');
      var tds = $(tables[0]).find('td');
      expect($(tds[0]).find('a').attr('href')).to.be('contextpopup_lv03_url');
      expect($(tds[1]).find('a').attr('href')).to.be(contextPermalink);
      expect($(tds[1]).text()).to.be('661\'473.0, 188\'192.0');
      expect($(tds[2]).find('a').attr('href')).to.be('contextpopup_lv95_url');
      expect($(tds[3]).text()).to.be('2\'725\'984.40, 1\'180\'787.40');
      expect($(tds[5]).text()).to.be('46.84203, 8.24453');
      expect($(tds[9]).text()).to.be('442\'396, 5\'187\'887 (zone 32T)');
      expect($(tds[11]).text()).to.be('32TMS 42396 87887 ');
      expect($(tds[13]).text()).to.be('das.ist.test');
      expect($(tds[15]).text()).to.be('1233 m');
      expect($(tds[17]).find('a').attr('href')).to.be(crosshairPermalink);
    });

    it('displays informations on long touch press', function() {
      var spy = sinon.spy(gaReframe, 'get03To95');
      var spy2 = sinon.spy(gaWhat3Words, 'getWords');
      var spyStop = sinon.spy(touchEvt, 'stopPropagation');
      var spyPrev = sinon.spy(touchEvt, 'preventDefault');
      handlers.pointerdown(touchEvt);
      $timeout.flush();
      $httpBackend.flush();

      expect(elt.css('display')).to.be('block');

      expect(spy.callCount).to.eql(1);
      expect(spy2.callCount).to.eql(1);
      expect(spyStop.callCount).to.eql(1);
      expect(spyPrev.callCount).to.eql(1);

      var tables = elt.find('div.popover-content table');
      var tds = $(tables[0]).find('td');
      expect($(tds[0]).find('a').attr('href')).to.be('contextpopup_lv03_url');
      expect($(tds[1]).find('a').attr('href')).to.be(contextPermalink);
      expect($(tds[1]).text()).to.be('661\'473.0, 188\'192.0');
      expect($(tds[2]).find('a').attr('href')).to.be('contextpopup_lv95_url');
      expect($(tds[3]).text()).to.be('2\'725\'984.40, 1\'180\'787.40');
      expect($(tds[5]).text()).to.be('46.84203, 8.24453');
      expect($(tds[9]).text()).to.be('442\'396, 5\'187\'887 (zone 32T)');
      expect($(tds[11]).text()).to.be('32TMS 42396 87887 ');
      expect($(tds[13]).text()).to.be('das.ist.test');
      expect($(tds[15]).text()).to.be('1233 m');
      expect($(tds[17]).find('a').attr('href')).to.be(crosshairPermalink);
    });

    it('doesn\'t display informations on long touch press if ctrlKey is pressed', function() {
      var spy = sinon.spy(gaReframe, 'get03To95');
      var ctrlEvt = $.extend({ctrlKey: true}, touchEvt);
      handlers.pointerdown(ctrlEvt);
      $timeout.flush();
      expect(spy.callCount).to.eql(0);
      expect(elt.css('display')).to.be('none');
    });

    it('doesn\'t display informations on long mouse press', function() {
      var spy = sinon.spy(gaReframe, 'get03To95');
      handlers.pointerdown(mouseEvt);
      $timeout.flush();
      expect(spy.callCount).to.eql(0);
      expect(elt.css('display')).to.be('none');
    });

    it('doesn\'t display information if pointerup event happens before 300ms', function() {
      var spy = sinon.spy(gaReframe, 'get03To95');

      // Touch
      handlers.pointerdown(touchEvt);
      handlers.pointerup(touchEvt);
      $timeout.flush();
      expect(spy.callCount).to.eql(0);
      expect(elt.css('display')).to.be('none');

      // Mouse
      handlers.pointerdown(mouseEvt);
      handlers.pointerup(mouseEvt);
      $timeout.verifyNoPendingTasks();
      expect(spy.callCount).to.eql(0);
      expect(elt.css('display')).to.be('none');
    });

    it('doesn\'t display information if pointermove event happens before 300ms', function() {
      var spy = sinon.spy(gaReframe, 'get03To95');

      // Touch
      handlers.pointerdown(touchEvt);
      handlers.pointermove(touchEvt2);
      $timeout.flush();

      expect(spy.callCount).to.eql(0);
      expect(elt.css('display')).to.be('none');

      // Mouse
      handlers.pointerdown(mouseEvt);
      handlers.pointermove(mouseEvt2);
      $timeout.verifyNoPendingTasks();

      expect(spy.callCount).to.eql(0);
      expect(elt.css('display')).to.be('none');
    });

    it('updates w3w text on $translateChangeEnd event', function() {
      var spy = sinon.stub(gaWhat3Words, 'getWords').returns($q.when('das.ist.test'));
      var evt = $.Event('contextmenu');
      evt.coordinate = [661473, 188192];
      evt.pixel = [25, 50];
      $(map.getViewport()).trigger(evt);
      $httpBackend.flush();
      expect(spy.callCount).to.eql(1);

      $rootScope.$broadcast('$translateChangeEnd');
      $rootScope.$digest();
      expect(spy.callCount).to.eql(2);
    });

    it('updates permalinks on gaPermalinkChange event', function() {
      var evt = $.Event('contextmenu');
      evt.coordinate = [661473, 188192];
      evt.pixel = [25, 50];
      $(map.getViewport()).trigger(evt);
      $httpBackend.flush();
      $rootScope.$digest();

      var spy = sinon.spy(gaPermalink, 'getHref');
      scope.$broadcast('gaPermalinkChange');
      expect(spy.callCount).to.eql(2);
    });
  });
});
