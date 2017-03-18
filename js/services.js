angular.module('healthy.services', [])

.factory("Auth",['$firebaseAuth',function($firebaseAuth) {
    var usersRef = new Firebase("https://easyhealthy.firebaseio.com/");
    return $firebaseAuth(usersRef);
}])


.factory('Dokter', ['$firebaseArray', function($firebaseArray) {
    var itemsRef = new Firebase('https://easyhealthy.firebaseio.com/dokter');
    return $firebaseArray(itemsRef);
}])
.factory('Klinik', ['$firebaseArray', function($firebaseArray) {
    var itemsRef = new Firebase('https://easyhealthy.firebaseio.com/klinik');
    return $firebaseArray(itemsRef);
}])




.service('LoginSer',['Auth', '$q', 'ProfileSer',function(Auth, $q, ProfileSer) {

    this.loginApp = function(user) {
        var deferred = $q.defer();
        Auth.$authWithPassword({
            email: user.email,
            password: user.pass
        }).then(function(authData) {
            var res = ProfileSer.getdatapegawai(authData.uid);
            res.then(function(bisa) {
                deferred.resolve(true);
            }, function(gagal) {
                deferred.resolve(false);

            });
        }).catch(function(error) {
            deferred.reject(error);
        });
        return deferred.promise;
    }

    this.cekAuth = function() {
        var deferred = $q.defer();
        Auth.$onAuth(function(authData) {
            if (authData) {
                deferred.resolve(true);
            } else {
                deferred.resolve(false);
            }
        });
        return deferred.promise;
    }
}])

.service('Notify',['webNotification', 'Global',function(webNotification, Global) {
    this.makenotify = function(img,text1,text2) {
        Global.playsound();
        webNotification.showNotification(text1, {
            body: text2,
            icon: img || 'img/icon.png',
            onClick: function onNotificationClicked() {
               
            }
            //autoClose: 4000 //auto close the notification after 4 seconds (you can manually close it via hide function)
        }, function onShow(error, hide) {
            if (error) {
                window.alert('Unable to show notification: ' + error.message);
            } else {
                setTimeout(function hideNotification() {
                    hide();
                }, 100000);
            }
        });
    }
}])

.service('Global',['$q', 'Auth', '$state', '$filter',function($q, Auth, $state, $filter) {


    this.getRandom = function() {
        return Math.floor((Math.random() * 10) + 1);
    }

    this.playsound = function() {
        var sound = new Audio('sound/pling.mp3');
        sound.play();
    }

    this.showDialog = function(tag) {
        var dialog = document.querySelector('#' + tag);
        try {
            dialog.showModal();
        } catch (error) {
            dialogPolyfill.registerDialog(dialog);
            dialog.showModal();
        }
    }

    this.hideDialog = function(tag) {
        var dialog = document.querySelector('#' + tag);
        dialog.close();
    }

    this.getIndoname = function(day) {
        var indo = $filter('date')(day, 'EEEE');
        switch (indo) {
            case 'Monday':
                indo = 'Senin';
                break;
            case 'Tuesday':
                indo = 'Selasa';
                break;
            case 'Wednesday':
                indo = 'Rabu';
                break;
            case 'Thursday':
                indo = 'Kamis';
                break;
            case 'Friday':
                indo = 'Jumat';
                break;
            case 'Saturday':
                indo = 'Sabtu';
                break;
            case 'Sunday':
                indo = 'Minggu';
                break;
            default:
                indo = 'Error';
        }
        return indo;
    }


    this.resetpass = function(user) {
        var deferred = $q.defer();
        var ref = new Firebase("https://easyhealthy.firebaseio.com/");
        ref.resetPassword({
            email: user
        }, function(error) {
            if (error === null) {
                deferred.resolve(true);
            } else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    }
    this.keluarapp = function() {
        Auth.$unauth();
        $state.go('login');
    }
}])


.service('ProfileSer',['$q', 'Auth',function($q, Auth) {
    this.getdatapegawai = function(uid) {
        var deferred = $q.defer();
        var ref = new Firebase("https://easyhealthy.firebaseio.com/dokter/" + uid);
        ref.once("value", function(snapshot) {
            var userData = snapshot.val();
            try {
                if (userData.spesialis == null || userData.spesialis == undefined) {
                    Auth.$unauth();
                    deferred.reject(false);
                } else {
                    deferred.resolve(userData);
                }
            } catch (err) {
                Auth.$unauth();
                deferred.reject(false);
            }
        }, function(errorobject) {
            deferred.reject(false);
        });
        return deferred.promise;
    }
    this.editprofile = function(uid, newprofiele) {
        var ref = new Firebase("https://easyhealthy.firebaseio.com/dokter/" + uid);
        ref.update({
            photo: newprofiele.photo,
            nomor_telp: newprofiele.nomor_telp,
            alamat:newprofiele.alamat,
            tarif:newprofiele.tarif
        });
    }
    this.ubahemail = function(uid, user, baru) {
        var deferred = $q.defer();
        var ref = new Firebase("https://easyhealthy.firebaseio.com/dokter/" + uid);
        ref.changeEmail({
            oldEmail: user.email,
            newEmail: baru.email,
            password: baru.pass
        }, function(error) {
            if (error === null) {
                ref.update({
                    email: baru.email
                });
                deferred.resolve(true);

            } else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    }
    this.ubahpassword = function(uid, user, baru) {
        var deferred = $q.defer();
        var ref = new Firebase("https://easyhealthy.firebaseio.com/dokter/" + uid);
        ref.changePassword({
            email: user.email,
            oldPassword: baru.ini,
            newPassword: baru.pass
        }, function(error) {
            if (error === null) {
                ref.update({
                    pass: baru.pass
                });
                deferred.resolve(true);
            } else {
                deferred.reject(error);
            }
        });
        return deferred.promise;
    }
}])

.service('PasienSer',[function() {
   

}])
.service('Periksa',['$firebaseArray','$q','$timeout','Dokter','Klinik','Notify',function($firebaseArray,$q,$timeout,Dokter,Klinik,Notify){
     this.getnamaklinik = function(uid){
        if(Klinik.length != 0){
            return Klinik.$getRecord(uid).nama;
        }
     }
     this.getnamadokter = function(uid){
        if(Dokter.length != 0){
            return Dokter.$getRecord(uid).nama;
        }
     }
     this.getprofilepasien=function(uid){
            var deferred = $q.defer();
             var ref = new Firebase("https://easyhealthy.firebaseio.com/users/"+uid);
             ref.once("value", function(snapshot) {
                deferred.resolve(snapshot.val());
             }, function(errorobject) {
                    
            });
            return deferred.promise;
    }
    this.getrekammedis=function(uid){
        try{
             var refrek = new Firebase("https://easyhealthy.firebaseio.com/rekam/"+uid)
             return $firebaseArray(refrek);
        }catch(error){

        }
    }

    this.tambahrekammedis = function(newitem,firelist,uid,dok,klini){
            firelist.$add({
                tgl:Firebase.ServerValue.TIMESTAMP,
                klinik:klini || null,
                dokter:dok || null,
                keluhan:newitem.keluhan|| null,
                periksa:newitem.pemeriksaan || null,
                lanjutan:newitem.lanjutan || null,
                diagnosa:newitem.diagnosa || null,
                kesimpulan:newitem.kesimpulan || null,
                obat:newitem.obat || null,
                kondisi:newitem.kondisi || null
            });        
    }
    this.hapusrekammedis = function(firelist,rekam){
        firelist.$remove(rekam);
    }
    this.editrekammedik=function(firelis,baru){
        firelis.$save(baru);
    }

    function setnullperiksa(){
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var refp = new Firebase("https://easyhealthy.firebaseio.com/dokter/"+ses.uid+"/periksa");
        refp.remove();
    }

    function savepasien(pasien){
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var today = new Date();
        var refsave = new Firebase("https://easyhealthy.firebaseio.com/history/dokter/"+ses.uid);

        refsave.child(today.getMonth()).once("value",function(snapshot){
            var j;
            try{
              j=snapshot.val().jum; 
            refsave.child(today.getMonth()).update({
                jum : j+1
            });
            }catch(error){
                refsave.child(today.getMonth()).update({
                    jum : 1
                });
            }
        },function(errorobject){

        });

       
    }


    function makenotiftopegawai(){
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var notif = new Firebase("https://easyhealthy.firebaseio.com/tmpnotif");
        notif.push().set({
            from: ses.uid || null,
            tmp:Firebase.ServerValue.TIMESTAMP
        });
    }

    //cek jadwal
    function cekjamprak(jam,menit,itemlist,pil){
        var balik = false;
        try{
          if(itemlist.start && itemlist.end){
            var day1 = new Date(itemlist.start);
            var day2 = new Date(itemlist.end);
                balik = ((jam==day1.getHours() && menit >= day1.getMinutes()) || (jam==day2.getHours() && menit<day2.getMinutes()) || (jam>day1.getHours() && jam<day2.getHours())) ? true : false;
          }
        }catch(error){ 

        }

        return balik;

    };

    function cekjadwaldokter(listjadwal){
        var stat = false;
        var day = new Date();
        var today = day.getDay();
        var jam = day.getHours();
        var menit = day.getMinutes();
        try{
         switch(today){
        case 0 :  stat = cekjamprak(jam,menit,listjadwal[6]); break;
        case 1 : stat = cekjamprak(jam,menit,listjadwal[0]);break;
        case 2 : stat = cekjamprak(jam,menit,listjadwal[1]); break;
        case 3 : stat = cekjamprak(jam,menit,listjadwal[2]);break;
        case 4 :  stat = cekjamprak(jam,menit,listjadwal[3]); break;
        case 5 : stat = cekjamprak(jam,menit,listjadwal[4]);break;
        case 6 :  stat =  cekjamprak(jam,menit,listjadwal[5]);break;

        }
        }catch(error){

        }
        return stat;
    }

   
    function sendtopaymentmethod(idpasien,listitem){
        var dk = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var itemsRef = new Firebase('https://easyhealthy.firebaseio.com/history/bayar');
        itemsRef.push().set({
            pasien:idpasien,
            item:listitem,
            tgl: Firebase.ServerValue.TIMESTAMP,
            dktr: dk.uid
        });
    }


    
    function getisi(lnya) {
        var a = [];
        var x = [];
        for (var i = 0; i < lnya.length; i++) {
            x[0] = lnya[i][0];
            x[1] = lnya[i][1];
            a.push(x);
            x = [];
        };
        return a;
    }

    this.selanjutnya=function(idpasien,profile,listitem){
        if(idpasien){
          setnullperiksa();
          makenotiftopegawai();
          savepasien(idpasien);
           sendtopaymentmethod(idpasien,getisi(listitem))
        }
        else{
           if(cekjadwaldokter(profile.listjadwal)){
                makenotiftopegawai();
           }
        }
       
    }
}])

;