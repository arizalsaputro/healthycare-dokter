angular.module('healthy.controllers', []).controller('loginCtrl',['$scope', '$state', '$timeout', 'LoginSer', 'Global',function($scope, $state, $timeout, LoginSer, Global) {
    $scope.resetpasswd = function(email) {
        if (!email) {
            makeToast("Masukkan Email")
        } else {
            $scope.showspin2 = true;
            var result = Global.resetpass(email);
            result.then(function(bisa) {
                $scope.showspin2 = false;
                makeToast("Kata sandi berhasil dikirim ke alamat " + email)
            }, function(err) {
                $scope.showspin2 = false;
                makeToast("Gagal mengatur ulang sandi")
            })
        }
    }
    $timeout(function() {
        var result = LoginSer.cekAuth();
        result.then(function(bisa) {
            if (bisa) {
                $state.go('dash.periksa')
            }
        })
    }, 1000);

    function makeToast(text) {
        var snackbarContainer = document.querySelector('#demo-toast-example');
        var data = {
            message: text
        };
        snackbarContainer.MaterialSnackbar.showSnackbar(data)
    }
    $scope.user = {};
    $scope.doLogin = function(user) {
        if (!user.email || !user.pass) {
            if (!user.email) {
                makeToast("Masukkan Email")
            }
            if (!user.pass) {
                makeToast("Masukkan Password")
            }
        } else {
            $scope.showspin = true;
            var result = LoginSer.loginApp(user);
            result.then(function(bisa) {
                $scope.showspin = false;
                if (bisa == true) {
                    $state.go('dash.periksa')
                } else {
                    makeToast("Anda bukan dokter,anda tidak memiliki akses.")
                }
            }, function(error) {
                $scope.showspin = false;
                if (error) {
                    switch (error.code) {
                        case "INVALID_PASSWORD":
                            makeToast("Password salah,periksa kembali password anda");
                            break;
                        case "NETWORK_ERROR":
                            makeToast("Tidak terkoneksi dengan jaringan");
                            break;
                        case "INVALID_EMAIL":
                            makeToast("Email salah,periksa kembali email anda");
                            break;
                        case "INVALID_USER":
                            makeToast("User belum terdaftar");
                            break;
                        case "UNKNOWN_ERROR":
                            makeToast("Terjadi kesalahan yang tidak diketahui");
                            break;
                        default:
                            makeToast("Terjadi kesalahan yang tidak diketahui")
                    }
                }
            })
        }
    }
}]).controller('AplCtrl',['$scope', 'Auth', '$filter', '$state','$firebaseArray', '$timeout','LoginSer', 'Global', 'PasienSer', 'Notify', 'ProfileSer','Periksa',function($scope, Auth, $filter, $state,$firebaseArray, $timeout,LoginSer, Global, PasienSer, Notify, ProfileSer,Periksa) {
    $scope.numron=Global.getRandom();

    getProfile();
    $scope.shownotifbox = false;
    $scope.dataprofile ;
    $scope.openimageprofile = function(nama, source) {
        $scope.tmpimg = {};
        $scope.tmpimg.nama = nama;
        $scope.tmpimg.img = source;
        $scope.showDialog('gambar')
    };
    $scope.makenotification = function() {
        $scope.shownotifbox = !$scope.shownotifbox
    };
    $scope.tesnotify = function() {
        Notify.makenotify()
    };
    $scope.openprofile = function() {
        if ($scope.dataprofile != undefined || $scope.dataprofile != null) {
            $state.go('dash.profile')
        }
    }

    $scope.getdatapasien=function(uid){
        if(uid){
            Periksa.getprofilepasien(uid).then(function(bisa){
                $scope.datapasienperiksa= bisa.profile;
                $scope.pasienklinik = bisa.regis.klinik;
                 $state.go('dash.periksa');
                 Notify.makenotify($scope.datapasienperiksa.photo,"Pasien Baru","Pasien baru telah siap untuk diperiksa.");
            });
        }
    }

    $scope.getRekammedis=function(uid){
        if(uid){return  Periksa.getrekammedis(uid);}
    }

    function getperiksa(uid){
        var resperiksa = new Firebase("https://easyhealthy.firebaseio.com/dokter/"+uid+"/periksa");
        resperiksa.on("value", function(snapshot) {
            $scope.pasienperiksa = snapshot.val();
            if($scope.pasienperiksa!=null){
                $scope.adapas=true;
                $scope.rekammedik=$scope.getRekammedis($scope.pasienperiksa);
                $scope.getdatapasien($scope.pasienperiksa);
            }else{
                $scope.rekammedik=null;
                $scope.datapasienperiksa=null;
                $scope.pasienklinik=null;
                $scope.adapas=false;
            }
        }, function(errorobject) {
           
        });
    }

    function getProfile() {
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var res = ProfileSer.getdatapegawai(ses.uid);
        getperiksa(ses.uid);
        res.then(function(profile) {
            $scope.dataprofile = profile
        }, function(err) {})
    }
    $scope.showUbahprofile = function(pasien) {
        window.localStorage.setItem("tampungsempas", JSON.stringify(pasien));
        $scope.editprofile = JSON.parse(window.localStorage.getItem("tampungsempas"));
        window.localStorage.removeItem("tampungsempas");
        Global.showDialog('ubahprofilepegawai')
    };
    $scope.ubahemailprofile = function(baru) {
        $scope.showspin = true;
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var result = ProfileSer.ubahemail(ses.uid, $scope.dataprofile, baru);
        result.then(function(bisa) {
            $scope.hideDialog('ubahemailpegawai');
           $scope.textberhasil = "email berhasil diperbarui";
                getProfile();
                $scope.showDialog('dialog3');
                $timeout(function(){
                    $scope.hideDialog('dialog3');
                },2000);
        }, function(error) {
            $scope.showspin = false;
            if (error) {
                switch (error.code) {
                    case 'EMAIL_TAKEN':
                        makefailtoast("Email sudah digunakan orang lain");
                        break;
                     case 'INVALID_PASSWORD':
                        makefailtoast("Password anda salah");
                        break;
                    case 'INVALID_EMAIL':
                        makefailtoast("Email lama anda salah");
                        break;
                    case 'NETWORK_ERROR':
                        makefailtoast("Periksa kembali jaringan anda");
                        break;
                    default:
                        makefailtoast("Terjadi kesalahan yang tidak diketahui")
                }
            }
        })
    };
    $scope.ubahprofilepass = function(baru) {
        $scope.showspin = true;
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var result = ProfileSer.ubahpassword(ses.uid, $scope.dataprofile, baru);
        result.then(function(bisa) {
            $scope.showspin = false;
            if (bisa) {
                $scope.hideDialog('ubahpasswordpegawai');
                   $scope.textberhasil = "password berhasil diperbarui";
                    getProfile();
                    $scope.showDialog('dialog3');
                    $timeout(function(){
                        $scope.hideDialog('dialog3');
                    },2000);
            }
        }, function(error) {
            $scope.showspin = false;
            if (error) {
                switch (error.code) {
                    case "NETWORK_ERROR":
                        makefailtoast("Jaringan bermasalah");
                        break;
                    case "INVALID_PASSWORD":
                        makefailtoast("Password lama salah");
                        break;
                    case "INVALID_EMAIL":
                        makefailtoast("Email lama salah");
                        break;
                    default:
                        makefailtoast("Terjadi kesalahan yang tidak diketahui")
                }
            }
        })
    }
    $scope.edituserprodfile = function(newprofiele) {
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        ProfileSer.editprofile(ses.uid, newprofiele);
        getProfile();
        $scope.hideDialog('ubahprofilepegawai')
    }
    var connectedRef = new Firebase("https://easyhealthy.firebaseio.com/.info/connected");
    $scope.preferences = [{
        name: "Laki-Laki",
        id: 'L'
    }, {
        name: "Perempuan",
        id: 'P'
    }];
    $timeout(function() {
        connectedRef.on("value", function(snap) {
            if (snap.val() === true) {
                $scope.showsnackbar = false
            } else {
                $scope.showsnackbar = true
            }
        })
    }, 1000);
    $scope.getRandomNum = function() {
        return Global.getRandom()
    }
    
    $scope.resetpass = function(user) {
        var result = Global.resetpass(user);
        result.then(function(bisa) {
            if (bisa) {
                makeToast("Reset password berhasil dikirim ke email " + user)
            }
        }, function(error) {
            if (error) {
                makeToast("Reset password gagal")
            }
        })
    };
    $scope.tampungdetail = function(det, pil) {
        if (pil == 1) {
            $scope.tampungpasien = det;
            $scope.realdate = new Date(det.profile.umur)
        }
        if (pil == 4) {
            $scope.tampungpegawai = det
        }
    };

    function makefailtoast(txt) {
        $scope.pesangagal = txt;
        $scope.gagallagi = true;
        $timeout(function() {
            $scope.gagallagi = false
        }, 3000)
    };
    $scope.setCari = function(cari) {
        $scope.search = cari;$scope.currentPage=0;
    }
    $scope.judul = "Pasien";
    $scope.changejud = function(judul) {
        $scope.judul = judul
    };

    function makeToast(text) {
        var snackbarContainer = document.querySelector('#demo-toast-example');
        var data = {
            message: text
        };
        snackbarContainer.MaterialSnackbar.showSnackbar(data)
    };
    $timeout(function() {
        var result = LoginSer.cekAuth();
        result.then(function(bisa) {
            if (!bisa) {
                $state.go('login')
            }
        })
    }, 1000);

    function showAlert() {
        var dialog = document.querySelector('#dialog3');
        try {
            dialog.showModal()
        } catch (error) {
            dialogPolyfill.registerDialog(dialog);
            dialog.showModal()
        }
        $timeout(function() {
            dialog.close()
        }, 3000)
    };
    $scope.showDialog = function(tag) {
        $scope.newItem = {};
        Global.showDialog(tag)
    }
    $scope.hideDialog = function(tag) {
        $scope.showpasspasien1 = false;
        $scope.showspin = false;
        Global.hideDialog(tag)
    }
    $scope.clickOutapp = function() {
        Global.showDialog('dialog')
    };

    $scope.showloading = function() {
        $scope.showTbl = true;
        Global.showDialog('loading')
    };
    $scope.keluarApp = function() {
        Global.keluarapp()
    };
    $scope.getindoday = function(day) {
        return Global.getIndoname(day)
    };
    $scope.setsearchnull = function() {
        $scope.search = ''
    };
    $scope.currentPage = 0;
    $scope.pageSize = 15;
    $scope.getData = function () {
      return $filter('filter')($scope.allUser,$scope.search);
    }
    $scope.numberOfPages=function(){
        return Math.ceil($scope.getData().length/$scope.pageSize);
    }
    $scope.prev=function(){
      $scope.currentPage=$scope.currentPage-1;
    }
    $scope.nexti=function(){
      $scope.currentPage=$scope.currentPage+1;
    }

    function getperbulan(){
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        var refgra = new Firebase("https://easyhealthy.firebaseio.com/history/dokter/"+ses.uid);
        $scope.listpasienperbulan = $firebaseArray(refgra);
    }
    getperbulan();
}]).controller('PeriksaCtrl',['$scope', '$timeout' ,'Periksa','$state','Global',function($scope, $timeout ,Periksa,$state,Global) {
    $scope.tambahrekammedis=function(newitem,firearr,uid){
        $scope.showspin=true;
        var ses = JSON.parse(window.localStorage.getItem("firebase:session::easyhealthy"));
        Periksa.tambahrekammedis(newitem,firearr,uid,ses.uid,$scope.pasienklinik);
        $scope.showspin=false;
        Global.hideDialog('addrekammedik');
    }
    $scope.showhapusrekammedik = function(rekam){
        $scope.rekammed = rekam;
        Global.showDialog('hapusrekam');
    }
    $scope.hapusrekammedik=function(){
         $scope.showspin=true;
        Periksa.hapusrekammedis($scope.rekammedik,$scope.rekammed);
        Global.hideDialog('hapusrekam');
        $scope.showspin=false;
    }
    $scope.lihatRekammedik=function(rekam){
        $scope.tmprekam = rekam;
        Global.showDialog('lihatrekammedik');
    }
    $scope.getnamaklinik=function(uid){
        if(uid){
              return Periksa.getnamaklinik(uid);
        }
    }
    $scope.getnamadokter=function(uid){
        if(uid){
                return Periksa.getnamadokter(uid);
        }
    }
    $scope.openeditrekam=function(rekam){
        $scope.editrekam=rekam;
        Global.showDialog('editrekammedik');
    }
    $scope.editrekammedik = function(rekam){
        if($scope.rekammedik){
            $scope.rekammedik.$save(rekam).then(function(){
                console.log(rekam);
            });
        }
        Global.hideDialog('editrekammedik');     
    }
    $scope.gettgllhr=function(tgl){
        return new Date(tgl);
    }

    

    $scope.simpantam=function(tampilkan){
        window.localStorage.setItem("isfirsttime", tampilkan)
    }

    $scope.openberikut=function(){
        if($scope.pasienperiksa){
             $scope.listitem = [["Dokter",$scope.dataprofile.tarif]];
            Global.showDialog('berikut');
        }else{
            $scope.nextperiksa();
        }
    }
    $scope.additem=function(){
        $scope.listitem.push([]);
    }
    $scope.rmitem=function(){
        if($scope.listitem.length > 1){
               $scope.listitem.splice($scope.listitem.length-1,1);
        }
    }

    function ceklistitem(){
        var s = false;
        try{
            for (var i = $scope.listitem.length - 1; i >= 0; i--) {
                if(!$scope.listitem[i][0] || !$scope.listitem[i][1]){
                    s=true;
                }
            };
        }catch(error){

        }
        return s;
    }

    $scope.nextperiksa = function(){
        if(ceklistitem()){
            $scope.pesangagal = "Lengkapi detail transaksi";
            $scope.gagallagi = true;
            $timeout(function() {
                $scope.gagallagi = false
            }, 3000)
        }else{

             try{
             Global.hideDialog('berikut');
            }catch(err){

            }
            if($scope.dataprofile){
                Periksa.selanjutnya($scope.pasienperiksa,$scope.dataprofile,$scope.listitem);
               
            }
            if(!window.localStorage.getItem("isfirsttime")){
                Global.showDialog('dialognext');
            }
        }
    }

}]).controller('HomeCtrl',['$scope',function($scope) {

     $scope.labels=["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
    $scope.data1 = [
        [0,0,0,0,0,0,0,0,0,0,0]
    ];
   
    function getGrapic() {
        for(var i = 0;i<$scope.listpasienperbulan.length;i++){
            $scope.data1[0][$scope.listpasienperbulan[i].$id] = $scope.listpasienperbulan[i].jum || 0;
        }
    }
    
    getGrapic();
    
}])
.directive('clickAnywhereButHere', function($document) {
    return {
        restrict: 'A',
        link: function(scope, elem, attr, ctrl) {
            elem.bind('click', function(e) {
                e.stopPropagation()
            });
            $document.bind('click', function() {
                scope.$apply(attr.clickAnywhereButHere)
            })
        }
    }
})
.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});