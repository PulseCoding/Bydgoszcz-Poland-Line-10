// ----------------------------------------------------//
// Se crean las instancias de las librerias a utilizar //
// ----------------------------------------------------//
try{
  var modbus = require('jsmodbus');
  var fs = require('fs');
  var PubNub = require('pubnub');
//Asignar host, puerto y otros par ametros al cliente Modbus
var client = modbus.client.tcp.complete({
    'host': "192.168.20.29",
    'port': 502,
    'autoReconnect': true,
    'timeout': 60000,
    'logEnabled'    : true,
    'reconnectTimeout': 30000
}).connect();

var intId,timeStop=40,flagONS1=0,flagONS2=0,flagONS3=0,flagONS4=0,flagONS5=0,flagONS6=0;
var JarSorter,ctJarSorter=0,speedTempJarSorter=0,secJarSorter=0,stopCountJarSorter=0,flagStopJarSorter=0,flagPrintJarSorter=0,speedJarSorter=0,timeJarSorter=0;
var actualJarSorter=0,stateJarSorter=0;
var Filler,ctFiller=0,speedTempFiller=0,secFiller=0,stopCountFiller=0,flagStopFiller=0,flagPrintFiller=0,speedFiller=0,timeFiller=0;
var actualFiller=0,stateFiller=0;
var Capper,ctCapper=0,speedTempCapper=0,secCapper=0,stopCountCapper=0,flagStopCapper=0,flagPrintCapper=0,speedCapper=0,timeCapper=0;
var actualCapper=0,stateCapper=0;
var FujiSealRoundWrapper,ctFujiSealRoundWrapper=0,speedTempFujiSealRoundWrapper=0,secFujiSealRoundWrapper=0,stopCountFujiSealRoundWrapper=0,flagStopFujiSealRoundWrapper=0,flagPrintFujiSealRoundWrapper=0,speedFujiSealRoundWrapper=0,timeFujiSealRoundWrapper=0;
var actualFujiSealRoundWrapper=0,stateFujiSealRoundWrapper=0;
var Shrinkwrapper,ctShrinkwrapper=0,speedTempShrinkwrapper=0,secShrinkwrapper=0,stopCountShrinkwrapper=0,flagStopShrinkwrapper=0,flagPrintShrinkwrapper=0,speedShrinkwrapper=0,timeShrinkwrapper=0;
var actualShrinkwrapper=0,stateShrinkwrapper=0;
var Paletizer,ctPaletizer=0,speedTempPaletizer=0,secPaletizer=0,stopCountPaletizer=0,flagStopPaletizer=0,flagPrintPaletizer=0,speedPaletizer=0,timePaletizer=0;
var actualPaletizer=0,statePaletizer=0;
var Barcode,secBarcode=0;
var secEOL=0,secPubNub=0;
var publishConfig;
var files = fs.readdirSync("/home/oee/Pulse/BYD_L10_LOGS/"); //Leer documentos
var text2send=[];//Vector a enviar
var i=0;

function idle(){
  i=0;
  text2send=[];
  for ( k=0;k<files.length;k++){//Verificar los archivos
    var stats = fs.statSync("/home/oee/Pulse/BYD_L10_LOGS/"+files[k]);
    var mtime = new Date(stats.mtime).getTime();
    if (mtime< (Date.now() - (8*60*1000))&&files[k].indexOf("serialbox")==-1){
      flagInfo2Send=1;
      text2send[i]=files[k];
      i++;
    }
  }
}
pubnub = new PubNub({
  publishKey : "pub-c-82cf38a9-061a-43e2-8a0f-21a6770ab473",
  subscribeKey : "sub-c-e14aa146-bab0-11e8-b6ef-c2e67adadb66",
  uuid : "bydgoszcz-L10-monitoring"
});

function senderData(){
  pubnub.publish(publishConfig, function(status, response) {
});}
// --------------------------------------------------------- //
//Función que realiza las instrucciones de lectura de datos  //
// --------------------------------------------------------- //
var DoRead = function (){
  if(secPubNub>=60*5){
    idle();
    secPubNub=0;
    publishConfig = {
      channel : "BYD_Monitor",
      message : {
            line: "10",
            tt: Date.now(),
            machines: text2send
          }
    };
    senderData();
  }else{
    secPubNub++;
  }
    client.readHoldingRegisters(0,99).then(function(resp){
        var statesJarSorter           = switchData(resp.register[0],resp.register[1]),
            statesFiller              = switchData(resp.register[2],resp.register[3]),
            statesCapper              = switchData(resp.register[4],resp.register[5]),
            statesFujiSealRoundWrapper= switchData(resp.register[6],resp.register[7]),
            statesShrinkwrapper       = switchData(resp.register[8],resp.register[9]),
            statesPaletizer           = switchData(resp.register[10],resp.register[11]);

          //JarSorter -------------------------------------------------------------------------------------------------------------
            ctJarSorter = joinWord(resp.register[23],resp.register[22]);
              if(flagONS1===0){
                 speedTempJarSorter=ctJarSorter;
                 flagONS1=1;
            }
            if (secJarSorter>=60){
                if(stopCountJarSorter===0||flagStopJarSorter==1){
                   flagPrintJarSorter=1;
                    secJarSorter=0;
                    speedJarSorter=ctJarSorter-speedTempJarSorter;
                    speedTempJarSorter=ctJarSorter;
                }
                if(flagStopJarSorter==1){
                    timeJarSorter=Date.now();
                }
            }
            secJarSorter++;
            if(ctJarSorter>actualJarSorter){
                stateJarSorter=1;//RUN
                if(stopCountJarSorter>=timeStop){
                    speedJarSorter=0;
                    secJarSorter=0;
                }
                timeJarSorter=Date.now();
                stopCountJarSorter=0;
                flagStopJarSorter=0;


            }else if(ctJarSorter==actualJarSorter){
                if(stopCountJarSorter===0){
                    timeJarSorter=Date.now();
                }
                stopCountJarSorter++;
                if(stopCountJarSorter>=timeStop){
                    stateJarSorter=2;//STOP
                    speedJarSorter=0;
                    if(flagStopJarSorter===0){
                        flagPrintJarSorter=1;
                        secJarSorter=0;
                    }
                    flagStopJarSorter=1;
                }
            }
            if(stateJarSorter==2){
                speedTempJarSorter=ctJarSorter;
            }

            actualJarSorter=ctJarSorter;
            if(stateJarSorter==2){
                if(statesJarSorter[5]==1){
                    stateJarSorter=3;//Wait
                }else{
                    if(statesJarSorter[4]==1){
                        stateJarSorter=4;//Block
                    }
                }
            }
            JarSorter = {
                ST: stateJarSorter,
                CPQO: joinWord(resp.register[23],resp.register[22]),
                SP: speedJarSorter
            };
            if(flagPrintJarSorter==1){
                for(var key in JarSorter){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L10_LOGS/pol_byd_JarSorter_L10.log","tt="+timeJarSorter+",var="+key+",val="+JarSorter[key]+"\n");
                }
                flagPrintJarSorter=0;
            }
          //JarSorter -------------------------------------------------------------------------------------------------------------
          //Filler -------------------------------------------------------------------------------------------------------------
            ctFiller = joinWord(resp.register[25],resp.register[24]);
              if(flagONS2===0){
                 speedTempFiller=ctFiller;
                 flagONS2=1;
            }
            if (secFiller>=60){
                if(stopCountFiller===0||flagStopFiller==1){
                   flagPrintFiller=1;
                    secFiller=0;
                    speedFiller=ctFiller-speedTempFiller;
                    speedTempFiller=ctFiller;
                }
                if(flagStopFiller==1){
                    timeFiller=Date.now();
                }
            }
            secFiller++;
            if(ctFiller>actualFiller){
                stateFiller=1;//RUN
                if(stopCountFiller>=timeStop){
                    speedFiller=0;
                    secFiller=0;
                }
                timeFiller=Date.now();
                stopCountFiller=0;
                flagStopFiller=0;


            }else if(ctFiller==actualFiller){
                if(stopCountFiller===0){
                    timeFiller=Date.now();
                }
                stopCountFiller++;
                if(stopCountFiller>=timeStop){
                    stateFiller=2;//STOP
                    speedFiller=0;
                    if(flagStopFiller===0){
                        flagPrintFiller=1;
                        secFiller=0;
                    }
                    flagStopFiller=1;
                }
            }
            if(stateFiller==2){
                speedTempFiller=ctFiller;
            }

            actualFiller=ctFiller;
            if(stateFiller==2){
                if(statesFiller[5]==1){
                    stateFiller=3;//Wait
                }else{
                    if(statesFiller[4]==1){
                        stateFiller=4;//Block
                    }
                }
            }
            Filler = {
                ST: stateFiller,
                CPQO: joinWord(resp.register[25],resp.register[24]),
                SP: speedFiller
            };
            if(flagPrintFiller==1){
                for(var key in Filler){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L10_LOGS/pol_byd_Filler_L10.log","tt="+timeFiller+",var="+key+",val="+Filler[key]+"\n");
                }
                flagPrintFiller=0;
            }
          //Filler -------------------------------------------------------------------------------------------------------------
          //Capper -------------------------------------------------------------------------------------------------------------
            ctCapper = joinWord(resp.register[27],resp.register[26]);
              if(flagONS3===0){
                 speedTempCapper=ctCapper;
                 flagONS3=1;
            }
            if (secCapper>=60){
                if(stopCountCapper===0||flagStopCapper==1){
                   flagPrintCapper=1;
                    secCapper=0;
                    speedCapper=ctCapper-speedTempCapper;
                    speedTempCapper=ctCapper;
                }
                if(flagStopCapper==1){
                    timeCapper=Date.now();
                }
            }
            secCapper++;
            if(ctCapper>actualCapper){
                stateCapper=1;//RUN
                if(stopCountCapper>=timeStop){
                    speedCapper=0;
                    secCapper=0;
                }
                timeCapper=Date.now();
                stopCountCapper=0;
                flagStopCapper=0;


            }else if(ctCapper==actualCapper){
                if(stopCountCapper===0){
                    timeCapper=Date.now();
                }
                stopCountCapper++;
                if(stopCountCapper>=timeStop){
                    stateCapper=2;//STOP
                    speedCapper=0;
                    if(flagStopCapper===0){
                        flagPrintCapper=1;
                        secCapper=0;
                    }
                    flagStopCapper=1;
                }
            }
            if(stateCapper==2){
                speedTempCapper=ctCapper;
            }

            actualCapper=ctCapper;
            if(stateCapper==2){
                if(statesCapper[5]==1){
                    stateCapper=3;//Wait
                }else{
                    if(statesCapper[4]==1){
                        stateCapper=4;//Block
                    }
                }
            }
            Capper = {
                ST: stateCapper,
                CPQO: joinWord(resp.register[27],resp.register[26]),
                SP: speedCapper
            };
            if(flagPrintCapper==1){
                for(var key in Capper){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L10_LOGS/pol_byd_Capper_L10.log","tt="+timeCapper+",var="+key+",val="+Capper[key]+"\n");
                }
                flagPrintCapper=0;
            }
          //Capper -------------------------------------------------------------------------------------------------------------
          //FujiSealRoundWrapper -------------------------------------------------------------------------------------------------------------
            ctFujiSealRoundWrapper = joinWord(resp.register[29],resp.register[28]);
              if(flagONS4===0){
                 speedTempFujiSealRoundWrapper=ctFujiSealRoundWrapper;
                 flagONS4=1;
            }
            if (secFujiSealRoundWrapper>=60){
                if(stopCountFujiSealRoundWrapper===0||flagStopFujiSealRoundWrapper==1){
                   flagPrintFujiSealRoundWrapper=1;
                    secFujiSealRoundWrapper=0;
                    speedFujiSealRoundWrapper=ctFujiSealRoundWrapper-speedTempFujiSealRoundWrapper;
                    speedTempFujiSealRoundWrapper=ctFujiSealRoundWrapper;
                }
                if(flagStopFujiSealRoundWrapper==1){
                    timeFujiSealRoundWrapper=Date.now();
                }
            }
            secFujiSealRoundWrapper++;
            if(ctFujiSealRoundWrapper>actualFujiSealRoundWrapper){
                stateFujiSealRoundWrapper=1;//RUN
                if(stopCountFujiSealRoundWrapper>=timeStop){
                    speedFujiSealRoundWrapper=0;
                    secFujiSealRoundWrapper=0;
                }
                timeFujiSealRoundWrapper=Date.now();
                stopCountFujiSealRoundWrapper=0;
                flagStopFujiSealRoundWrapper=0;


            }else if(ctFujiSealRoundWrapper==actualFujiSealRoundWrapper){
                if(stopCountFujiSealRoundWrapper===0){
                    timeFujiSealRoundWrapper=Date.now();
                }
                stopCountFujiSealRoundWrapper++;
                if(stopCountFujiSealRoundWrapper>=timeStop){
                    stateFujiSealRoundWrapper=2;//STOP
                    speedFujiSealRoundWrapper=0;
                    if(flagStopFujiSealRoundWrapper===0){
                        flagPrintFujiSealRoundWrapper=1;
                        secFujiSealRoundWrapper=0;
                    }
                    flagStopFujiSealRoundWrapper=1;
                }
            }
            if(stateFujiSealRoundWrapper==2){
                speedTempFujiSealRoundWrapper=ctFujiSealRoundWrapper;
            }

            actualFujiSealRoundWrapper=ctFujiSealRoundWrapper;
            if(stateFujiSealRoundWrapper==2){
                if(statesFujiSealRoundWrapper[5]==1){
                    stateFujiSealRoundWrapper=3;//Wait
                }else{
                    if(statesFujiSealRoundWrapper[4]==1){
                        stateFujiSealRoundWrapper=4;//Block
                    }
                }
            }
            FujiSealRoundWrapper = {
                ST: stateFujiSealRoundWrapper,
                CPQO: joinWord(resp.register[29],resp.register[28]),
                SP: speedFujiSealRoundWrapper
            };
            if(flagPrintFujiSealRoundWrapper==1){
                for(var key in FujiSealRoundWrapper){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L10_LOGS/pol_byd_FujiSealRoundWrapper_L10.log","tt="+timeFujiSealRoundWrapper+",var="+key+",val="+FujiSealRoundWrapper[key]+"\n");
                }
                flagPrintFujiSealRoundWrapper=0;
            }
          //FujiSealRoundWrapper -------------------------------------------------------------------------------------------------------------
          //Shrinkwrapper -------------------------------------------------------------------------------------------------------------
            ctShrinkwrapper = joinWord(resp.register[33],resp.register[32]);
              if(flagONS5===0){
                 speedTempShrinkwrapper=ctShrinkwrapper;
                 flagONS5=1;
            }
            if (secShrinkwrapper>=60){
                if(stopCountShrinkwrapper===0||flagStopShrinkwrapper==1){
                   flagPrintShrinkwrapper=1;
                    secShrinkwrapper=0;
                    speedShrinkwrapper=ctShrinkwrapper-speedTempShrinkwrapper;
                    speedTempShrinkwrapper=ctShrinkwrapper;
                }
                if(flagStopShrinkwrapper==1){
                    timeShrinkwrapper=Date.now();
                }
            }
            secShrinkwrapper++;
            if(ctShrinkwrapper>actualShrinkwrapper){
                stateShrinkwrapper=1;//RUN
                if(stopCountShrinkwrapper>=timeStop){
                    speedShrinkwrapper=0;
                    secShrinkwrapper=0;
                }
                timeShrinkwrapper=Date.now();
                stopCountShrinkwrapper=0;
                flagStopShrinkwrapper=0;


            }else if(ctShrinkwrapper==actualShrinkwrapper){
                if(stopCountShrinkwrapper===0){
                    timeShrinkwrapper=Date.now();
                }
                stopCountShrinkwrapper++;
                if(stopCountShrinkwrapper>=timeStop){
                    stateShrinkwrapper=2;//STOP
                    speedShrinkwrapper=0;
                    if(flagStopShrinkwrapper===0){
                        flagPrintShrinkwrapper=1;
                        secShrinkwrapper=0;
                    }
                    flagStopShrinkwrapper=1;
                }
            }
            if(stateShrinkwrapper==2){
                speedTempShrinkwrapper=ctShrinkwrapper;
            }

            actualShrinkwrapper=ctShrinkwrapper;
            if(stateShrinkwrapper==2){
                if(statesShrinkwrapper[5]==1){
                    stateShrinkwrapper=3;//Wait
                }else{
                    if(statesShrinkwrapper[4]==1){
                        stateShrinkwrapper=4;//Block
                    }
                }
            }
            Shrinkwrapper = {
                ST: stateShrinkwrapper,
                CPQI: joinWord(resp.register[31],resp.register[30]),
                CPQO: joinWord(resp.register[33],resp.register[32]),
                SP: speedShrinkwrapper
            };
            if(flagPrintShrinkwrapper==1){
                for(var key in Shrinkwrapper){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L10_LOGS/pol_byd_Shrinkwrapper_L10.log","tt="+timeShrinkwrapper+",var="+key+",val="+Shrinkwrapper[key]+"\n");
                }
                flagPrintShrinkwrapper=0;
            }
          //Shrinkwrapper -------------------------------------------------------------------------------------------------------------
          //Paletizer -------------------------------------------------------------------------------------------------------------
            ctPaletizer = joinWord(resp.register[35],resp.register[34]);
              if(flagONS6===0){
                 speedTempPaletizer=ctPaletizer;
                 flagONS6=1;
            }
            if (secPaletizer>=60){
                if(stopCountPaletizer===0||flagStopPaletizer==1){
                   flagPrintPaletizer=1;
                    secPaletizer=0;
                    speedPaletizer=ctPaletizer-speedTempPaletizer;
                    speedTempPaletizer=ctPaletizer;
                }
                if(flagStopPaletizer==1){
                    timePaletizer=Date.now();
                }
            }
            secPaletizer++;
            if(ctPaletizer>actualPaletizer){
                statePaletizer=1;//RUN
                if(stopCountPaletizer>=timeStop){
                    speedPaletizer=0;
                    secPaletizer=0;
                }
                timePaletizer=Date.now();
                stopCountPaletizer=0;
                flagStopPaletizer=0;


            }else if(ctPaletizer==actualPaletizer){
                if(stopCountPaletizer===0){
                    timePaletizer=Date.now();
                }
                stopCountPaletizer++;
                if(stopCountPaletizer>=timeStop){
                    statePaletizer=2;//STOP
                    speedPaletizer=0;
                    if(flagStopPaletizer===0){
                        flagPrintPaletizer=1;
                        secPaletizer=0;
                    }
                    flagStopPaletizer=1;
                }
            }
            if(statePaletizer==2){
                speedTempPaletizer=ctPaletizer;
            }

            actualPaletizer=ctPaletizer;
            if(statePaletizer==2){
                if(statesPaletizer[5]==1){
                    statePaletizer=3;//Wait
                }else{
                    if(statesPaletizer[4]==1){
                        statePaletizer=4;//Block
                    }
                }
            }
            Paletizer = {
                ST: statePaletizer,
                CPQI: joinWord(resp.register[35],resp.register[34]),
                SP: speedPaletizer
            };
            if(flagPrintPaletizer==1){
                for(var key in Paletizer){
                    fs.appendFileSync("/home/oee/Pulse/BYD_L10_LOGS/pol_byd_Paletizer_L10.log","tt="+timePaletizer+",var="+key+",val="+Paletizer[key]+"\n");
                }
                flagPrintPaletizer=0;
            }
          //Paletizer -------------------------------------------------------------------------------------------------------------
          //Barcode -------------------------------------------------------------------------------------------------------------
          if(resp.register[50]==0&&resp.register[51]==0&&resp.register[52]==0&&resp.register[53]==0&&resp.register[54]==0&&resp.register[55]==0&&resp.register[56]==0&&resp.register[57]==0){
            Barcode='0';
          }else {
            var dig1=hex2a(assignment(resp.register[50]).toString(16));
            var dig2=hex2a(assignment(resp.register[51]).toString(16));
            var dig3=hex2a(assignment(resp.register[52]).toString(16));
            var dig4=hex2a(assignment(resp.register[53]).toString(16));
            var dig5=hex2a(assignment(resp.register[54]).toString(16));
            var dig6=hex2a(assignment(resp.register[55]).toString(16));
            var dig7=hex2a(assignment(resp.register[56]).toString(16));
            var dig8=hex2a(assignment(resp.register[57]).toString(16));
          Barcode=dig1+dig2+dig3+dig4+dig5+dig6+dig7+dig8;
          }
          if(isNaN(Barcode)){
            Barcode='0';
          }
	        if(secBarcode>=60&&!isNaN(Barcode)){
              writedataBarcode(Barcode,"pol_byd_Barcode_L10.log");
              secBarcode=0;
          }
          secBarcode++;
          //Barcode -------------------------------------------------------------------------------------------------------------
          //EOL --------------------------------------------------------------------------------------------------------------------
          if(secEOL>=60){
            fs.appendFileSync("../BYD_L10_LOGS/pol_byd_EOL_L10.log","tt="+Date.now()+",var=EOL"+",val="+Paletizer.CPQI+"\n");
            secEOL=0;
          }
          secEOL++;
          //EOL --------------------------------------------------------------------------------------------------------------------
    });//END Client Read
};

var assignment = function (val){
  var result;
  if(val<4095)
    result = "";
  else
    result = val;
    return result;
};

function hex2a(hex){
   var str = '';
   for (var i = 0; i < hex.length; i += 2)
   str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

var stateMachine = function (data){
	if(data[7]==1){
		return 1;//RUN
	}
	if(data[6]==1){
		return 2;//STOP
	}
	if(data[5]==1){
		return 3;//WAIT
	}
	if(data[4]==1){
		return 4;//BLOCK
	}
	return 2;
};

var counterState = function (actual,temp){
	if(actual!=temp){
		return 1;
	}else {
		return 2;
	}
};

var writedata = function (varJson,nameFile){
    var data;
    var timet=Date.now();
    for(var key in varJson){
        fs.appendFileSync("/home/pi/Pulse/BYD_L10_LOGS/"+nameFile,"tt="+timet+",var="+key+",val="+varJson[key]+"\n");
    }
};

var writedataBarcode = function (barcode,nameFile){
    var timet=Date.now();
    fs.appendFileSync("../BYD_L10_LOGS/"+nameFile,"tt="+timet+",var=bc"+",val="+barcode+"\n");
};

var joinWord = function (num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
         bin2=num2.toString(2),
         newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[31-i]=bin1[(bin1.length-1)-i];
        }
        for(var j=0;j<bin2.length;j++){
            newNum[15-j]=bin2[(bin2.length-1)-j];
        }
        bits=newNum.join("");
        return parseInt(bits,2);
};
var switchData = function (num1,num2){
    var bits="00000000000000000000000000000000";
    var  bin1=num1.toString(2),
        bin2=num2.toString(2),
        newNum = bits.split("");

        for(var i=0;i<bin1.length;i++){
            newNum[15-i]=bin1[(bin1.length-1)-i];
        }
        for(var j=0;j<bin2.length;j++){
            newNum[31-j]=bin2[(bin2.length-1)-j];
        }
        bits=newNum.join("");

        return bits;
};

var stop = function () {
    ///This function clean data
    clearInterval(intId);
};

var shutdown = function () {
    ///Use function STOP and close connection
    stop();
    client.close();
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);


///*If client is connect call a function "DoRead"*/
client.on('connect', function(err) {
    setInterval(function(){
        DoRead();
    }, 1000);
});

///*If client is in a error ejecute an acction*/
client.on('error', function (err) {
    fs.appendFileSync("error.log","ID 1: "+Date.now()+": "+err+"\n");
    //console.log('Client Error', err);
});
///If client try closed, this metodo try reconnect client to server
client.on('close', function () {
    //console.log('Client closed, stopping interval.');
    fs.appendFileSync("error.log","ID 2: "+Date.now()+": "+'Client closed, stopping interval.'+"\n");
    stop();
});

}catch(err){
    fs.appendFileSync("error.log","ID 3: "+Date.now()+": "+err+"\n");
}
