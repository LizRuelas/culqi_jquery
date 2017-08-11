

$("#response-panel").hide();
   Culqi.publicKey = 'pk_test_Rp2uV5dXI3quFq2X';

    $('#btnPay').on('click', function (e) {
         // Abre el formulario con las opciones de Culqi.configurar
         Culqi.createToken();
         e.preventDefault();
     });
// Recibimos Token del Culqi.js
        function culqi() {
          if (Culqi.token) {
              $(document).ajaxStart(function(){
                run_waitMe();
              });
              // Imprimir Token
              $(document).ajaxStart(function(){
                run_waitMe();
              });
              resultdiv("La creación de token ha sido exiotosa :" + " " + Culqi.token.id );
              console.log(Culqi.token.id);
          } else {
            // Hubo un problema...
            // Mostramos JSON de objeto error en consola
            $('#response-panel').show();
            $('#response').html(Culqi.error.merchant_message);
            $('body').waitMe('hide');
          }
        };
        function run_waitMe(){
          $('body').waitMe({
            effect: 'orbit',
            text: 'Procesando pago...',
            bg: 'rgba(255,255,255,0.7)',
            color:'#28d2c8'
          });
        }
        function resultdiv(message){
          $('#response-panel').show();
          $('#response').html(message);
          $('body').waitMe('hide');
        }
