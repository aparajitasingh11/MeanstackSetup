
      var animsition_pages;

      function myFunction() {
        animsition_pages = setTimeout(showPage, 00);
      }

      function showPage() {
        $("#loader").css("display", "none");
        $("#loderBG").removeClass("loderBG");
        $("body").css("overflow", "auto");
        $(".animsition").addClass("active");
      }

       /******slider********* */
  $(".tmnl_slider").slick({
          dots: true,
          infinite: true,
          centerMode: true,
          slidesToShow: 1,
          slidesToScroll: 1,
          autoplay: false,
          arrows: true,
        });




$(document).ready(function() {
        // new WOW().init();

$(window).scroll(function () {
      if ($(document).scrollTop() > 10) {
        $('.main_nav').addClass('fix_header');
      }
      if ($(document).scrollTop() < 10) {
        $('.main_nav').removeClass('fix_header');
      }
});


      function setModalMaxHeight(element) {
  this.$element     = $(element);  
  this.$content     = this.$element.find('.modal-content');
  var borderWidth   = this.$content.outerHeight() - this.$content.innerHeight();
  var dialogMargin  = $(window).width() < 768 ? 20 : 60;
  var contentHeight = $(window).height() - (dialogMargin + borderWidth);
  var headerHeight  = this.$element.find('.modal-header').outerHeight() || 0;
  var footerHeight  = this.$element.find('.modal-footer').outerHeight() || 0;
  var maxHeight     = contentHeight - (headerHeight + footerHeight);

  this.$content.css({
      'overflow': 'hidden'
  });
  
  this.$element
    .find('.modal-body').css({
      'max-height': maxHeight,
      'overflow-y': 'auto',
  });
}

$('.modal').on('show.bs.modal', function() {
  $(this).show();
  setModalMaxHeight(this);
});

$(window).resize(function() {
  if ($('.modal.in').length != 0) {
    setModalMaxHeight($('.modal.in'));
  }
});


// Morris.Bar({
//   element: 'bar-example',
//    data: [
//     { date: '22/06', value: 400 },
//     { date: '23/06', value: 100 },
//     { date: '24/06', value: 600 },
//     { date: '24/06', value: 900 },
//   ],

//   xkey: 'date',
//   ykeys: ['value'],
//   stacked: true,
//   barRatio: 0.4,
//       // xLabelAngle: 35,
//       xLabelMargin: 0,
//   labels: ['Orders'],
//   barColors: ["#19be00"],
// hideHover: false,

//   postUnits: 'k',
//       formatter: function (y) { return y + "k" }
// });


//   new Morris.Line({
//   // ID of the element in which to draw the chart.
//   element: 'line-chart',
//   // Chart data records -- each entry in this array corresponds to a point on
//   // the chart.
//   data: [


//     { date: '22/06', value: 400 },
//     { date: '23/06', value: 100 },
//     { date: '24/06', value: 600 },
//     { date: '24/06', value: 900 },

//   ],
//   // The name of the data record attribute that contains x-values.
//   xkey: 'date',
//   parseTime: false,
//   // A list of names of data record attributes that contain y-values.
//   ykeys: ['value'],
//   // Labels for the ykeys -- will be displayed when you hover over the
//   // chart.
//   labels: ['Orders'],
//   lineColors: ['#19be00'],
//   postUnits: 'k',
//       formatter: function (y) { return y + "k" }
// });




//   new Morris.Line({
//   // ID of the element in which to draw the chart.
//   element: 'tow_line-chart',
//   // Chart data records -- each entry in this array corresponds to a point on
//   // the chart.
//   data: [


//     { date: '22/06', a: 400 , b: 900},
//     { date: '23/06', a: 100 , b: 200},
//     { date: '24/06', a: 600 , b: 400},
//     { date: '24/06', a: 900 , b: 600},

//   ],
//   // The name of the data record attribute that contains x-values.
//   xkey: 'date',
//   parseTime: false,
//   // A list of names of data record attributes that contain y-values.
//   ykeys: ['a', 'b'],
//   // Labels for the ykeys -- will be displayed when you hover over the
//   // chart.
//   labels: ['Series A', 'Series B'],
//   lineColors: ['#19be00',"#6cd7f9"],
//   postUnits: 'k',
//       formatter: function (y) { return y + "k" }
// });

//  var color_array = ['#19be00', '#6cd7f9', '#ffcd00'];
//   var browsersChart = Morris.Donut({
//     element: 'pie-chart',
//     data   : [
//     {"label":"Chrome","value":423},
//     {"label":"Safari","value":75},
//     {"label":"Firefox","value":147},
//     ],
//     colors: color_array
//   });
//   browsersChart.options.data.forEach(function(label, i){
//     var legendItem = $('<span></span>').text(label['label']).prepend('<i>&nbsp;</i>');
//     legendItem.find('i').css('backgroundColor', browsersChart.options.colors[i]);
//     $('#legend').append(legendItem)
//   })




});


