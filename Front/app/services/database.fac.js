'use strict';
app.factory('appDB',['$http','$q','$rootScope','environment',appDB]);
function appDB($http,$q,$rootScope,environment){
    var serializeData = function( data ) {
                    // If this is not an object, defer to native stringification.
                    if ( ! angular.isObject( data ) ) {
                        return( ( data == null ) ? "" : data.toString() );
                    }
                    var buffer = [];
                    // Serialize each key in the object.
                    for ( var name in data ) {
                        if ( ! data.hasOwnProperty( name ) ) {
                            continue;
                        }
                        var value = data[ name ];
                        buffer.push(
                            encodeURIComponent( name ) +
                            "=" +
                            encodeURIComponent( ( value == null ) ? "" : value )
                            );
                    }
                    // Serialize the buffer and clean it up for transportation.
                    var source = buffer
                    .join( "&" )
                    .replace( /%20/g, "+" )
                    ;
                    return( source );
                }
                
                return{
                 callPostJSON:function(url, data){
                     return  $q(function(resolve, reject){
                        url = environment.base_url+url;
                        $http({method: 'POST',
                            url:url,
                            data:data
                        }).then(function successCallback(response) {
                            if(response.data.status){
                                resolve (response.data)
                            }
                            else{
                                reject (response.data)
                            }
                        },function errorCallback(response){
                            reject (response.data)

                        })
                    })

                 },

                 callPostForm:function(url, data){
                     return  $q(function(resolve, reject){
                       url = environment.base_url+url;
                       data = serializeData(data);
                       $http({method: 'POST',
                        url:url,
                        headers: {'Content-Type': 'application/x-www-form-urlencoded; charset=utf-8'},
                        data: data
                    }).then(function successCallback(response) {
                        if(response.data.status){
                            resolve (response.data)
                        } else{
                            reject (response.data)
                        }
                    },function errorCallback(response){
                        reject (response.data)
                    })
                })

                 },

                 /*Get method*/
                 callGet:function(url, data){
                     return  $q(function(resolve, reject){
                        url = environment.base_url+url;
                        $http({method: 'GET',
                            url:url,
                            data:data
                        }).then(function successCallback(response) {
                            if(response.data.status){
                                resolve (response.data)
                            }
                            else{
                                reject (response.data)
                            }
                        },function errorCallback(response){
                            reject (response.data)
                        })
                    })
                 },

             }

         }

