import type { ChallengeDefinition, ChallengeLane, ChallengeKind } from './contracts.ts'

// Ejemplos y explicaciones originales de CAI; material de refuerzo, no examen de nivel.
// Por tema: cuatro contextos diferentes. El orden intercala temas antes de repetirlos.
type Item = [prompt:string,correct:string,wrong1:string,wrong2:string,example:string]
type Topic = { lane:ChallengeLane;topic:string;kind:ChallengeKind;rule:string;items:Item[] }
const topics:Topic[] = [
{lane:'grammar',topic:'Be: am, is y are',kind:'complete',rule:'I usa am; he, she e it usan is; you, we y they usan are. Para describir estado o identidad no añadimos do.',items:[
["My sister ___ a nurse.","is","are","am","My brother is a chef. = Mi hermano es cocinero."],
["We ___ ready for class.","are","is","am","They are early today. = Hoy llegaron temprano."],
["I ___ tired after the trip.","am","is","are","I am hungry. = Tengo hambre."],
["___ your parents at home?","Are","Is","Am","Are you busy? = ¿Estás ocupado?"]]},
{lane:'grammar',topic:'La s de he y she',kind:'complete',rule:'En presente simple afirmativo, he, she e it llevan verbo con -s o -es. Con I, you, we y they usamos la forma base.',items:[
["Leo ___ English every Saturday.","studies","study","studying","She studies at night. = Ella estudia de noche."],
["My dad ___ to work by bus.","goes","go","going","He goes home at six. = Él se va a casa a las seis."],
["Our teacher ___ two languages.","speaks","speak","speaking","Ana speaks slowly. = Ana habla despacio."],
["The shop ___ at nine every morning.","opens","open","opening","The class starts at ten. = La clase empieza a las diez."]]},
{lane:'grammar',topic:'Do y does en preguntas',kind:'complete',rule:'En preguntas de presente simple usamos do con I/you/we/they y does con he/she/it. Después va el verbo base, sin otra -s.',items:[
["___ your friend play the guitar?","Does","Do","Is","Does he work here? = ¿Él trabaja aquí?"],
["___ they need more time?","Do","Does","Are","Do we have homework? = ¿Tenemos tarea?"],
["Where ___ she live?","does","do","is","Where does Luis study? = ¿Dónde estudia Luis?"],
["What time ___ you finish work?","do","does","are","When do they arrive? = ¿Cuándo llegan?"]]},
{lane:'grammar',topic:'Después de did',kind:'complete',rule:'Did ya marca el pasado. En preguntas y negativas con did/did not, el verbo principal vuelve a su forma base.',items:[
["Did you ___ the email?","send","sent","sending","Did she call? = ¿Ella llamó?"],
["We didn't ___ the film.","enjoy","enjoyed","enjoying","I didn't buy it. = No lo compré."],
["Where did Marco ___ yesterday?","go","went","gone","Where did they eat? = ¿Dónde comieron?"],
["She didn't ___ my message.","read","reads","reading","He didn't answer. = Él no respondió."]]},
{lane:'grammar',topic:'Estar haciendo algo',kind:'complete',rule:'El presente continuo se forma con am/is/are + verbo en -ing. No omitimos be y no ponemos el verbo en forma base después de be.',items:[
["Please wait. I ___ working right now.","am","do","have","I am writing now. = Estoy escribiendo ahora."],
["Look! The dog is ___ in the garden.","running","run","runs","She is cooking. = Ella está cocinando."],
["They ___ studying at the moment.","are","do","have","We are listening. = Estamos escuchando."],
["Is he ___ for the bus now?","waiting","wait","waits","Are you coming? = ¿Vienes ahora?"]]},
{lane:'grammar',topic:'Rutina o ahora',kind:'complete',rule:'El presente simple suele expresar rutinas; be + -ing describe una acción en curso. Las pistas every day y right now aclaran el contexto.',items:[
["Every morning, I ___ breakfast at seven.","eat","am eating","eating","I walk to class every day. = Camino a clase a diario."],
["Right now, Sara ___ to her teacher.","is talking","talk","talks every day","She is reading now. = Está leyendo ahora."],
["My cousins ___ football every weekend.","play","are play","playing","They train on Fridays. = Entrenan los viernes."],
["Be quiet, please. The baby ___.","is sleeping","sleep","sleeps every night","The children are sleeping now. = Ahora están durmiendo."]]},
{lane:'grammar',topic:'Since y for',kind:'complete',rule:'Since señala el punto de inicio; for expresa cuánto dura algo. Compara since 2022 con for three years.',items:[
["I have lived here ___ 2022.","since","for","during","She has worked here since May. = Trabaja aquí desde mayo."],
["We've waited ___ twenty minutes.","for","since","ago","I've studied for an hour. = He estudiado durante una hora."],
["He has known Ana ___ childhood.","since","for","ago","They have been friends since school. = Son amigos desde la escuela."],
["She has studied English ___ six months.","for","since","at","We've stayed for two days. = Nos hemos quedado dos días."]]},
{lane:'grammar',topic:'Pasado terminado y experiencia',kind:'complete',rule:'Un momento terminado como yesterday o last week suele llevar pasado simple. El presente perfecto usa have/has + participio para experiencias o conexiones con el presente.',items:[
["We ___ the museum yesterday.","visited","have visited","has visited","I called yesterday. = Llamé ayer."],
["She ___ never travelled abroad.","has","did","is","He has never tried sushi. = Nunca ha probado sushi."],
["They ___ that film last week.","watched","have watched","has watched","We met last Monday. = Nos conocimos el lunes pasado."],
["I ___ never visited Canada.","have","did","am","I have visited Peru twice. = He visitado Perú dos veces."]]},
{lane:'grammar',topic:'A y an: importa el sonido',kind:'complete',rule:'A va antes de un sonido consonante y an antes de un sonido vocálico. Importa el sonido inicial, no solo la letra: an hour y a university.',items:[
["I'd like ___ apple, please.","an","a","many","An orange is on the table. = Hay una naranja en la mesa."],
["She is ___ university student.","a","an","some","A uniform can be blue. = Un uniforme puede ser azul."],
["The meeting lasts ___ hour.","an","a","many","An honest answer helps. = Una respuesta honesta ayuda."],
["He bought ___ new notebook.","a","an","much","I need a pencil. = Necesito un lápiz."]]},
{lane:'grammar',topic:'Some y any',kind:'complete',rule:'Some es frecuente en afirmaciones; any suele usarse en negativas y preguntas neutras. Con plurales como chairs, much no sirve.',items:[
["There aren't ___ chairs in this room.","any","some","much","We don't have any tickets. = No tenemos boletos."],
["I bought ___ oranges for the trip.","some","any","much","She has some ideas. = Ella tiene algunas ideas."],
["Do you have ___ questions about the task?","any","much","a","Are there any buses? = ¿Hay autobuses?"],
["We don't need ___ more books.","any","some","much","He doesn't have any coins. = Él no tiene monedas."]]},
{lane:'grammar',topic:'Much y many',kind:'complete',rule:'Many acompaña sustantivos contables en plural. Much acompaña cantidades no contables como water, time o money.',items:[
["How ___ students are in your class?","many","much","a","How many books? = ¿Cuántos libros?"],
["There isn't ___ water left.","much","many","a","We don't have much time. = No tenemos mucho tiempo."],
["How ___ time do we have?","much","many","an","How much money? = ¿Cuánto dinero?"],
["Do you have ___ friends in this city?","many","much","an","She has many hobbies. = Ella tiene muchos pasatiempos."]]},
{lane:'grammar',topic:'Comparaciones claras',kind:'complete',rule:'Para comparar dos cosas usamos comparativo + than: easier than o more expensive than. No combinamos more con una forma que ya lleva -er.',items:[
["This exercise is ___ than the last one.","easier","more easier","easiest","This book is shorter than that one. = Este libro es más corto."],
["My bag is ___ than yours.","heavier","more heavier","heaviest","The box is heavier than the bag. = La caja pesa más."],
["This phone is ___ expensive than that one.","more","most","muchest","The train is more comfortable. = El tren es más cómodo."],
["Today is ___ than yesterday.","colder","more colder","coldest","This room is warmer than the hall. = Este cuarto es más cálido."]]},
{lane:'grammar',topic:'Quién hace y quién recibe',kind:'complete',rule:'I/he/she/we/they suelen ser sujeto. Me/him/her/us/them se usan como objeto, también después de preposiciones.',items:[
["Please send the photo to ___. (yo)","me","I","my","Call me later. = Llámame después."],
["___ is my English teacher. (ella)","She","Her","Hers","He is my neighbour. = Él es mi vecino."],
["Can you help ___? (nosotros)","us","we","our","They invited us. = Nos invitaron."],
["I saw ___ at the station. (él)","him","he","his","She called him. = Ella lo llamó."]]},
{lane:'grammar',topic:"Its, it's y posesión",kind:'complete',rule:"It's significa it is o it has. Its indica posesión sin apóstrofo. Your acompaña un nombre; you're significa you are.",items:[
["The cat is washing ___ paws.","its","it's","it is","The dog moved its tail. = El perro movió su cola."],
["___ a beautiful day! (It is)","It's","Its","Their","It's sunny today. = Hoy hace sol."],
["Is this ___ notebook? (tu)","your","you're","you are","Your idea is useful. = Tu idea es útil."],
["___ very kind. (You are)","You're","Your","Yours","You're welcome. = De nada."]]},
{lane:'grammar',topic:'Participios con have y has',kind:'complete',rule:'Después de have/has usamos participio: gone, seen, eaten, written. El pasado simple went/saw/ate/wrote no sustituye al participio.',items:[
["Have you ___ this film?","seen","saw","see","I've seen that picture. = He visto esa imagen."],
["She has ___ a letter.","written","wrote","write","He has written a message. = Ha escrito un mensaje."],
["We have already ___ lunch.","eaten","ate","eat","They have eaten rice. = Han comido arroz."],
["He has ___ home.","gone","went","go","The bus has gone. = El autobús se ha ido."]]},
{lane:'words',topic:'Actually y currently',kind:'meaning',rule:'Actually aclara o corrige: en realidad. Currently indica la situación actual: actualmente. No son traducciones intercambiables.',items:[
["Quieres decir «Actualmente trabajo desde casa». Elige el inicio.","Currently,","Actually,","Eventually,","I currently live in Puebla. = Actualmente vivo en Puebla."],
["Corriges un dato: «En realidad, no soy de Madrid».","Actually, I'm not from Madrid.","Currently, I'm not from Madrid.","Eventually, I'm not from Madrid.","Actually, I prefer tea. = En realidad, prefiero té."],
["«Nuestra directora está de viaje actualmente».","Our director is currently travelling.","Our director is actually travelling.","Our director will eventually travel.","She is currently studying. = Actualmente está estudiando."],
["Elige el significado habitual de actually.","En realidad","Actualmente","Finalmente","Actually, it was easy. = En realidad, fue fácil."]]},
{lane:'words',topic:'Sensible y sensitive',kind:'meaning',rule:'Sensible describe a alguien sensato o una decisión razonable. Sensitive describe sensibilidad emocional o física.',items:[
["Una decisión sensata es una ___ decision.","sensible","sensitive","sensibility","That's a sensible plan. = Es un plan sensato."],
["«Mi piel es sensible»: My skin is ___.","sensitive","sensible","sensibly","My eyes are sensitive to light. = Mis ojos son sensibles a la luz."],
["¿Qué palabra describe a una persona razonable al decidir?","sensible","sensitive","sensitivity","Be sensible about money. = Sé sensato con el dinero."],
["Se lastiman sus sentimientos con facilidad. He is ___.","sensitive","sensible","sensibly","She's sensitive to criticism. = Es sensible a la crítica."]]},
{lane:'words',topic:'Library y bookshop',kind:'meaning',rule:'Library es biblioteca, donde se consultan o prestan libros. Bookshop o bookstore es una tienda donde se compran.',items:[
["Quieres pedir un libro prestado en la biblioteca. Vas a la ___.","library","bookshop","laboratory","The library lends books. = La biblioteca presta libros."],
["¿Qué significa bookstore?","Librería o tienda de libros","Biblioteca pública","Cuaderno de notas","I bought a novel at the bookstore. = Compré una novela en la librería."],
["«La biblioteca cierra a las seis»: The ___ closes at six.","library","bookshopper","librarian","Our library is quiet. = Nuestra biblioteca es tranquila."],
["Quieres comprar una novela nueva. ¿Qué lugar buscas?","A bookshop","A library card","A bookshelf","There is a bookshop nearby. = Hay una librería cerca."]]},
{lane:'words',topic:'Attend y assist',kind:'meaning',rule:'Attend significa asistir a un evento o clase. Assist significa ayudar. Para decir asistir a clase no usamos assist the class.',items:[
["«Voy a asistir a la reunión»: I'll ___ the meeting.","attend","assist","assistance","We attend class on Tuesdays. = Asistimos a clase los martes."],
["¿Qué significa assist someone?","Ayudar a alguien","Asistir a una fiesta","Esperar a alguien","Can I assist you? = ¿Puedo ayudarte?"],
["«Ella ayuda al equipo»: She ___ the team.","assists","attends to school","attendance","He assists the coach. = Él ayuda al entrenador."],
["«¿Asististe al curso?»: Did you ___ the course?","attend","assist","assist to","They attended the workshop. = Asistieron al taller."]]},
{lane:'words',topic:'Embarrassed y pregnant',kind:'meaning',rule:'Embarrassed significa avergonzado. Pregnant significa embarazada. El parecido con español no garantiza el significado.',items:[
["Te da vergüenza equivocarte. You feel ___.","embarrassed","pregnant","embarrassing","I felt embarrassed about my mistake. = Me dio vergüenza mi error."],
["¿Qué palabra significa embarazada?","pregnant","embarrassed","embarrassment","She is pregnant. = Ella está embarazada."],
["«Estoy avergonzado»: I'm ___.","embarrassed","pregnant","pregnancy","He looked embarrassed. = Parecía avergonzado."],
["Una situación que provoca vergüenza es ___.","embarrassing","embarrassed","pregnant","It was an embarrassing moment. = Fue un momento vergonzoso."]]},
{lane:'words',topic:'Borrow y lend',kind:'complete',rule:'Borrow es recibir algo prestado; lend es dárselo prestado a otra persona. La dirección del préstamo cambia el verbo.',items:[
["Can I ___ your charger? I'll return it tonight.","borrow","lend","borrowed","I borrowed a pencil. = Pedí un lápiz prestado."],
["Could you ___ me your notes?","lend","borrow","borrowing","She lent me a book. = Me prestó un libro."],
["I can ___ you my umbrella.","lend","borrow","borrows","We can lend you a chair. = Podemos prestarte una silla."],
["Where can I ___ a dictionary for an hour?","borrow","lend","lending","He borrowed my jacket. = Él pidió prestada mi chamarra."]]},
{lane:'words',topic:'Say y tell',kind:'complete',rule:'Tell suele llevar directamente a la persona: tell me. Say puede llevar palabras o, para el destinatario, to: say something to me.',items:[
["Please ___ me the truth.","tell","say","said","Tell us your name. = Dinos tu nombre."],
["What did she ___?","say","told","telling","What did he say? = ¿Qué dijo?"],
["He ___ me a story yesterday.","told","said","say","She told them the news. = Les contó la noticia."],
["Please ___ hello to your sister for me.","say","tell","told","Say thank you. = Di gracias."]]},
{lane:'words',topic:'Make y do',kind:'complete',rule:'Algunas combinaciones se aprenden juntas: do homework, do exercise, make a mistake y make a decision. No se traducen siempre con el mismo verbo.',items:[
["I need to ___ my homework.","do","make","made","Do your homework first. = Haz tu tarea primero."],
["Everyone can ___ a mistake.","make","do","did","I made a mistake. = Cometí un error."],
["We have to ___ a decision today.","make","do","doing","They made a decision. = Tomaron una decisión."],
["She likes to ___ exercise before work.","do","make","made","We do exercise on Mondays. = Hacemos ejercicio los lunes."]]},
{lane:'words',topic:'Job y work',kind:'complete',rule:'Job es contable: a job, two jobs. Work, para trabajo en general, es no contable; también funciona como verbo.',items:[
["She has a new ___.","job","work","working","I'm looking for a job. = Busco un empleo."],
["I have a lot of ___ today.","work","job","working","There is work to do. = Hay trabajo que hacer."],
["He has two part-time ___.","jobs","works","work","She applied for three jobs. = Solicitó tres empleos."],
["Where do you ___? (¿Dónde trabajas?)","work","job","works","I work at a hospital. = Trabajo en un hospital."]]},
{lane:'words',topic:'Look, see y watch',kind:'complete',rule:'Look at dirige la mirada; see puede ser percibir con la vista; watch se usa al observar durante un tiempo, por ejemplo una película.',items:[
["Please ___ at the board.","look","see","watching","Look at this photo. = Mira esta foto."],
["I ___ TV every evening.","watch","look","listen","We watch films together. = Vemos películas juntos."],
["No alcanzo a distinguir el letrero: I can't ___ the sign.","see","look","listen","Can you see the moon? = ¿Alcanzas a ver la luna?"],
["Let's ___ a film tonight.","watch","look","hearing","She watches the game. = Ella ve el partido."]]},
{lane:'words',topic:'Teach y learn',kind:'complete',rule:'Teach es enseñar. Learn es aprender. El profesor teaches y el alumno learns; no intercambiamos el papel de quien explica y quien adquiere conocimiento.',items:[
["Our teacher ___ us new words.","teaches","learns","learning","She teaches English. = Ella enseña inglés."],
["Quiero aprender a nadar: I want to ___ how to swim.","learn","teach","teaches","We learn together. = Aprendemos juntos."],
["Can you ___ me this grammar rule?","teach","learn","learned","He taught me a song. = Él me enseñó una canción."],
["Ella aprendió una expresión ayer: She ___ a useful expression yesterday.","learned","taught","learns","I learned a new word. = Aprendí una palabra nueva."]]},
{lane:'words',topic:'Win y earn',kind:'complete',rule:'Win es ganar una competición o un premio. Earn expresa obtener algo por trabajo o mérito, como salario o confianza.',items:[
["They hope to ___ the match.","win","earn","wins","We won the final. = Ganamos la final."],
["I ___ money by teaching.","earn","win","earning","She earns a salary. = Ella gana un sueldo."],
["Who will ___ the race?","win","earn","earning","He won a prize. = Él ganó un premio."],
["You can ___ a salary by working here.","earn","win","earning","They earned our respect. = Se ganaron nuestro respeto."]]},
{lane:'words',topic:'Fun y funny',kind:'meaning',rule:'Fun se relaciona con diversión o algo agradable. Funny puede significar gracioso, que hace reír; también extraño según el contexto.',items:[
["La fiesta fue muy divertida: We had a lot of ___.","fun","funny","funnily","The game was fun. = El juego fue divertido."],
["El chiste hizo reír: It was a ___ joke.","funny","fun","funnily","That story is funny. = Esa historia es graciosa."],
["¿Qué significa have fun?","Divertirse","Tener un chiste","Ser extraño siempre","Have fun at the concert! = ¡Diviértete en el concierto!"],
["Quieres decir que alguien hace reír. They are ___.","funny","a funnily","funnily","My cousin tells funny stories. = Mi primo cuenta historias graciosas."]]},
{lane:'words',topic:'Meet y know',kind:'complete',rule:'Meet sirve para conocer a alguien por primera vez o encontrarse. Know expresa ya conocer a una persona, lugar o dato.',items:[
["Nice to ___ you! Es la primera presentación.","meet","know","knowing","I'd like to meet your team. = Me gustaría conocer a tu equipo."],
["I ___ Laura. We've been friends for years.","know","meet for the first time","knowing","Do you know this city? = ¿Conoces esta ciudad?"],
["Where did you first ___ your friend?","meet","know","knew","We met at school. = Nos conocimos en la escuela."],
["Do you ___ the answer?","know","meet","meeting","I know his name. = Sé su nombre."]]},
{lane:'words',topic:'Bored, boring y otras emociones',kind:'complete',rule:'Con emociones, -ed suele describir cómo te sientes; -ing describe lo que provoca esa sensación. Una persona también puede ser boring si aburre a otros.',items:[
["The lesson interests me. I feel ___.","interested","interesting","interest","I'm interested in music. = Me interesa la música."],
["The film makes us feel excited. It is ___.","exciting","excited","excitement","It was an exciting match. = Fue un partido emocionante."],
["I have nothing to do. I'm ___.","bored","boring","bore","She feels bored. = Ella se siente aburrida."],
["The long talk makes people tired. It's ___.","tiring","tired","tire","The trip was tiring. = El viaje fue cansado."]]},
{lane:'everyday',topic:'La edad con be',kind:'choose',rule:'Para expresar edad usamos be: I am twenty. No traducimos literalmente tener años con have.',items:[
["Di «Tengo dieciocho años».","I am eighteen years old.","I have eighteen years.","I am eighteen years.","He is twelve years old. = Él tiene doce años."],
["Pregunta la edad de alguien.","How old are you?","How many years you have?","How old do you have?","How old is your sister? = ¿Cuántos años tiene tu hermana?"],
["Di «Mi hermano tiene diez años».","My brother is ten.","My brother has ten.","My brother have ten.","They are twenty years old. = Tienen veinte años."],
["Completa: Our teacher ___ thirty years old.","is","has","have","My friend is nineteen. = Mi amigo tiene diecinueve años."]]},
{lane:'everyday',topic:'El clima necesita sujeto',kind:'complete',rule:'Al hablar del clima solemos usar it como sujeto: it is cold o it is raining. En inglés no omitimos ese sujeto como en español.',items:[
["___ is raining outside.","It","There","He","It is snowing. = Está nevando."],
["Hace frío: It ___ cold today.","is","has","does","It is warm in here. = Aquí hace calor."],
["Hace sol: ___ sunny.","It's","Is","Has","It's windy today. = Hoy hace viento."],
["¿Hace calor? ___ it hot?","Is","Does","Has","Is it raining? = ¿Está lloviendo?"]]},
{lane:'everyday',topic:'Agree no necesita am',kind:'choose',rule:'Agree ya es un verbo: I agree, I agree with you. No decimos I am agree. Para disentir se puede usar I disagree.',items:[
["Elige «Estoy de acuerdo contigo».","I agree with you.","I am agree with you.","I agree you.","We agree with Ana. = Estamos de acuerdo con Ana."],
["Completa: She ___ with the plan.","agrees","is agree","agreeing","He agrees with us. = Él está de acuerdo con nosotros."],
["Elige una forma correcta de expresar desacuerdo.","I disagree.","I am disagree.","I don't am agree.","We disagree about the date. = No coincidimos sobre la fecha."],
["Pregunta «¿Estás de acuerdo?».","Do you agree?","Are you agree?","Do you are agree?","Does he agree? = ¿Él está de acuerdo?"]]},
{lane:'everyday',topic:'Querer y planes con to',kind:'complete',rule:'Para expresar lo que quieres hacer usamos want to + verbo. Después de want no añadimos -ing en esta estructura.',items:[
["I want ___ English more often.","to practise","practising","practise","I want to learn. = Quiero aprender."],
["She wants ___ a new course.","to start","starting","starts","He wants to help. = Quiere ayudar."],
["Do you want ___ us?","to join","joining","joins","They want to come. = Quieren venir."],
["We want ___ early tomorrow.","to leave","leaving","left","I want to rest. = Quiero descansar."]]},
{lane:'everyday',topic:'Like y would like',kind:'complete',rule:'Like puede expresar gustos habituales. Would like expresa un deseo de forma cortés: I would like a tea o I would like to try.',items:[
["En una cafetería: I ___ like a tea, please.","would","am","do to","I'd like some water. = Quisiera agua."],
["Para decir un gusto habitual: I ___ jazz.","like","would to","am like","She likes quiet places. = Le gustan los lugares tranquilos."],
["Invitación cortés: ___ you like to join us?","Would","Are","Have","Would you like some tea? = ¿Te gustaría té?"],
["Quisiera aprender: I'd like ___ more.","to learn","learning","learns","We'd like to visit. = Nos gustaría visitar."]]},
{lane:'everyday',topic:'There is y there are',kind:'complete',rule:'There is presenta una cosa o cantidad no contable. There are presenta varias cosas. No confundimos there con they.',items:[
["___ a café near the station.","There is","There are","They is","There is a park here. = Hay un parque aquí."],
["___ three chairs in the kitchen.","There are","There is","They are have","There are two windows. = Hay dos ventanas."],
["Is ___ any milk in the fridge?","there","they","their","Is there a bus stop? = ¿Hay una parada?"],
["There ___ many people outside.","are","is","has","There are several shops. = Hay varias tiendas."]]},
{lane:'everyday',topic:'At, on e in para tiempo',kind:'complete',rule:'At se usa con horas; on con días o fechas; in con meses, años y partes del día como the morning. At night es una expresión habitual.',items:[
["The class starts ___ eight o'clock.","at","on","in","Meet me at noon. = Nos vemos al mediodía."],
["We have English ___ Tuesday.","on","in","at","I work on Fridays. = Trabajo los viernes."],
["My birthday is ___ July.","in","on","at","The course starts in March. = El curso empieza en marzo."],
["I usually study ___ the morning.","in","on","at","We eat in the evening. = Comemos por la tarde-noche."]]},
{lane:'everyday',topic:'Pedir ayuda con cortesía',kind:'reply',rule:'Una petición puede usar Could you…? o Can you…? Para aceptarla de forma clara sirven Sure u Of course. El contexto indica si aceptas, agradeces o pides repetir.',items:[
["Te piden ayuda y quieres aceptar: «Could you help me?»","Of course. What do you need?","No, I won't.","I am twenty.","Sure, I can help. = Claro, puedo ayudar."],
["No escuchaste. Pide que repitan con cortesía.","Could you say that again, please?","Could you that again?","You repeat yesterday.","Could you repeat the name? = ¿Podrías repetir el nombre?"],
["Pide que hablen más despacio.","Could you speak more slowly, please?","Could you speaking slowly?","You can slow yesterday.","Please speak slowly. = Habla despacio, por favor."],
["Alguien te ayuda. Quieres agradecer.","Thank you for your help.","Give me your help.","I have help yesterday.","Thanks for explaining. = Gracias por explicar."]]},
{lane:'everyday',topic:'Indicaciones sencillas',kind:'meaning',rule:'Turn left/right indican girar; go straight on es seguir derecho. Next to significa junto a y opposite, enfrente de.',items:[
["Debes girar a la izquierda. Elige la indicación.","Turn left.","Turn right.","Go straight on.","Turn right at the bank. = Gira a la derecha en el banco."],
["La farmacia está junto al banco. It's ___ the bank.","next to","far from","inside of us","The café is next to the park. = El café está junto al parque."],
["Quieres decir «Sigue derecho».","Go straight on.","Turn around.","Go upstairs.","Go straight on for two blocks. = Sigue derecho dos cuadras."],
["El museo está enfrente del hotel. It's ___ the hotel.","opposite","between","under","The shop is opposite the school. = La tienda está enfrente de la escuela."]]},
{lane:'everyday',topic:'Orden en preguntas',kind:'order',rule:'En preguntas con do/does usamos palabra interrogativa + auxiliar + sujeto + verbo base. Con be, ponemos be antes del sujeto.',items:[
["Ordena la pregunta sobre dónde vive alguien.","Where do you live?","Where you do live?","Where do live you?","What do you study? = ¿Qué estudias?"],
["Pregunta por el trabajo de ella.","What does she do?","What she does do?","What does do she?","Where does she work? = ¿Dónde trabaja ella?"],
["Pregunta si están listos.","Are they ready?","They are ready? Are.","Do they are ready?","Are you ready? = ¿Estás listo?"],
["Pregunta a qué hora empieza la clase.","What time does the class start?","What time the class does starts?","What time does start the class?","When does the film start? = ¿Cuándo empieza la película?"]]},
{lane:'everyday',topic:'Adverbios de frecuencia',kind:'choose',rule:'Adverbios como usually u often suelen ir antes del verbo principal y después de be. Estas opciones contrastan con errores de estructura, no con otras posiciones válidas.',items:[
["Elige una forma correcta de decir «Ella siempre llega a tiempo».","She is always on time.","She always is on times have.","She does always is on time.","He is usually early. = Él suele llegar temprano."],
["Completa: I ___ drink coffee after dinner.","never","am never to","never am to","I often walk home. = A menudo camino a casa."],
["Elige una frase correcta sobre una rutina.","We usually study after lunch.","We are usually study after lunch.","We usually studies after lunch.","They often cook together. = Cocinan juntos con frecuencia."],
["Completa: He is ___ late. (nunca)","never","never to","doesn't never","She is never late. = Ella nunca llega tarde."]]},
{lane:'everyday',topic:'Qué forma sigue al verbo',kind:'complete',rule:'Enjoy suele ir seguido de -ing; decide usa to + verbo; can y must van con la forma base, sin to. Aprende estas combinaciones como bloques.',items:[
["I enjoy ___ in English.","reading","to read","read","She enjoys swimming. = Le gusta nadar."],
["We decided ___ the earlier train.","to take","taking","took","I decided to stay. = Decidí quedarme."],
["She can ___ very well.","sing","to sing","sings","They can dance. = Pueden bailar."],
["You must ___ your name here.","write","to write","writes","We must leave. = Debemos irnos."]]},
{lane:'everyday',topic:'Information y advice',kind:'complete',rule:'Information, advice, furniture y luggage suelen ser no contables. Para contar usamos expresiones como a piece of; no añadimos una -s normal.',items:[
["I need some ___ about the course.","information","informations","an information","This information is useful. = Esta información es útil."],
["She gave me a piece of ___.","advice","advices","an advice","Thanks for your advice. = Gracias por tu consejo."],
["The hotel has new ___.","furniture","furnitures","a furniture","The furniture is old. = Los muebles son antiguos."],
["My ___ is very heavy.","luggage","luggages","a luggage","Where is my luggage? = ¿Dónde está mi equipaje?"]]},
{lane:'everyday',topic:'A few y a little',kind:'complete',rule:'A few acompaña plurales contables; a little acompaña cantidades no contables. Aquí distinguimos el tipo de sustantivo, no la valoración de si alcanza.',items:[
["We have ___ apples for the picnic.","a few","a little","much","I have a few questions. = Tengo unas preguntas."],
["Add ___ water, please.","a little","a few","many","I need a little help. = Necesito un poco de ayuda."],
["I know ___ words in German.","a few","a little","much","She has a few friends here. = Tiene algunos amigos aquí."],
["We have ___ time before class.","a little","a few","many","There is a little milk left. = Queda un poco de leche."]]},
{lane:'everyday',topic:'Respuestas cortas',kind:'reply',rule:'En respuestas cortas repetimos el auxiliar adecuado: do/does, be o can. Para una respuesta afirmativa, no cambiamos a otro auxiliar.',items:[
["Responde afirmativamente: «Do you like tea?»","Yes, I do.","Yes, I am.","Yes, I have.","Do they study? Yes, they do. = ¿Estudian? Sí."],
["Responde afirmativamente: «Is she your teacher?»","Yes, she is.","Yes, she does.","Yes, she has.","Is he ready? Yes, he is. = ¿Está listo? Sí."],
["Responde afirmativamente: «Can you swim?»","Yes, I can.","Yes, I do.","Yes, I am.","Can she sing? Yes, she can. = ¿Puede cantar? Sí."],
["Responde negativamente: «Does he work here?»","No, he doesn't.","No, he isn't work.","No, he don't.","Does it help? No, it doesn't. = ¿Ayuda? No."]]},
]
const instructions:Record<ChallengeKind,string>={complete:'Completa la frase.',choose:'Elige la frase correcta.',meaning:'Elige la palabra o expresión que corresponde a la idea.',reply:'Elige la respuesta adecuada para esta situación.',order:'Elige el orden correcto.'}
export const challengeBank:ChallengeDefinition[] = (['grammar','words','everyday'] as const).flatMap(lane=>{
 const pool=topics.filter(topic=>topic.lane===lane)
 return Array.from({length:4},(_,round)=>pool.map((topic,index)=>{
  const [prompt,correct,wrong1,wrong2,example]=topic.items[round]!
  const shift=(round+index)%3,raw=[correct,wrong1,wrong2],options=raw.map((_,i)=>raw[(i+shift)%3]!)
  return {id:lane+'-'+String(round*pool.length+index+1).padStart(3,'0'),lane,topic:topic.topic,kind:topic.kind,instruction:instructions[topic.kind],question:prompt,options,correctIndex:options.indexOf(correct),explanation:topic.rule,example}
 })).flat()
})

