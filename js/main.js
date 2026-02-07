let eventBus = new Vue()
Vue.component('Cards', {
    template: `
       <div class="Cards">
       <h1>Заметки</h1>
       <create_card></create_card>
        <p class="error" v-for="error in errors">{{ error }}</p>
           <div class="cards_inner">
                <div class="cards_item">
                    <h2 id="h2_one">Новые</h2>
                    <columns1 :columnFirst="columnFirst"></columns1>
                </div>
                <div class="cards_item">
                <h2 id="h2_two">В процессе</h2>
                    <columns2 :columnSecond="columnSecond"></columns2>
                </div>
                <div class="cards_item">
                <h2 id="h2_three">Завершенные</h2>
                    <columns3 :columnThird="columnThird"></columns3>
                </div>
           </div>
       </div>`,
    data() {
        return {
            columnFirst:[],
            columnSecond:[],
            columnThird:[],
            errors: []
        }
    },
    mounted() {
        this.loadLocal()
        eventBus.$on('card-submitted', card => {
            this.errors = []
            if(this.columnFirst.length < 3){
                this.columnFirst.push(card)
            }else {
                this.errors.push('В первой колонке нельзя добавить больше 3-х карточек.')
            }
            this.saveLocal()
        })
        eventBus.$on('addColumnSecond', card => {
            this.errors = []
            if(this.columnSecond.length < 5){
                this.columnSecond.push(card)
                this.columnFirst.splice(this.columnFirst.indexOf(card), 1)
            }else if (this.columnSecond.length === 5) {
                this.errors.push('Во второй колонке не должно быть больше 5-и карточек')
                if(this.columnFirst.length > 0) {
                    this.columnFirst.forEach(item => {
                        item.arrTask.forEach(item => {
                            item.completed = true;
                        })
                    })
                }
            }
            this.saveLocal()
        })
        eventBus.$on('addColumnThird', card =>{
            this.columnThird.push(card)
            this.columnSecond.splice(this.columnSecond.indexOf(card), 1)

            if(this.columnSecond.length < 5) {
                if(this.columnFirst.length > 0) {
                    this.columnFirst.forEach(item => {
                        item.arrTask.forEach(item => {
                            item.completed = false;
                        })
                    })
                }
            }
            this.saveLocal()
        })
        eventBus.$on('addColumnOneThird', card =>{

            if (this.columnSecond.length >= 5) {
                this.errors.push("Вы не можете редактировать первую колонку, пока есть во второй есть 5 карточек")
            } else {
                this.columnThird.push(card)
                this.columnFirst.splice(this.columnFirst.indexOf(card), 1)
            }
            this.saveLocal()
        })

    },
    methods: {
        saveLocal() {
            localStorage.setItem('cards', JSON.stringify({
                columnFirst: this.columnFirst,
                columnSecond: this.columnSecond,
                columnThird: this.columnThird,
            }))
        },
        loadLocal() {
            const data = JSON.parse(localStorage.getItem('cards'))
            if (data) {
                this.columnFirst = data.columnFirst
                this.columnSecond = data.columnSecond
                this.columnThird = data.columnThird
            }
        },
    },

})

Vue.component('Columns1', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnFirst"><h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input  
                            
                            :disabled="task.completed" 
                            @click="updateColumn(card, task)"
                            class="checkbox" type="checkbox"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                            </input>
                    </li>
                </span>
            </div>
       </div>`,

    props: {
        columnFirst:{
            type: Array,

        },
        errors: {
            type: Array,
        },

    },
    methods: {
        updateColumn(card, task) {
            card.status += 1
            task.completed = true
            let cardTask = 0
            for(let i = 0; i < 5; i++){
                if (card.arrTask[i].title != null) {
                    cardTask++
                }
            }
            if ((card.status / cardTask) * 100 >= 50) {
                eventBus.$emit('addColumnSecond', card)
            }
            if ((card.status / cardTask) * 100 === 100) {
                card.data = new Date().toLocaleString()
                eventBus.$emit('addColumnOneThird', card)
            }

        },
    },

})

Vue.component('Columns2', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnSecond"><h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input
                            :disabled="task.completed" 
                            @click="updateColumnTwo(card, task)"
                            class="checkbox" type="checkbox"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                            </input>
                    </li>
                </span>
            </div>
       </div>`,
    props: {
        columnSecond:{
            type: Array,

        },

    },
    methods: {
        updateColumnTwo(card, task) {
            card.status += 1
            task.completed = true
            let cardTask = 0
            for(let i = 0; i < 5; i++){
                if (card.arrTask[i].title != null) {
                    cardTask++
                }
            }
            if ((card.status / cardTask) * 100 === 100) {
                card.data = new Date().toLocaleString()
                eventBus.$emit('addColumnThird', card)
            }

        },
    }

})
Vue.component('Columns3', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnThird"><h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input
                            :disabled="task.completed" 
                            @click="updateColumnTrird(card, task)"
                            class="checkbox" type="checkbox"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                            </input>
                    </li>
                    <p>Дата окончания: <br>{{card.data}}</p>
                    
                </span>
            </div>
       </div>`,
    props: {
        columnThird:{
            type: Array,

        },
        saveLocal: {
            type: Function
        }

    },
    methods: {}

})

Vue.component('modalWindow', {
    template: `
<section>
<div class="bu">
    <a href="#openModal" class="btn btnModal">Создать карточку</a>
</div>
<div id="openModal" class="modal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Название</h3>
        <a href="#close" title="Close" class="close">×</a>
      </div>
      <div class="modal-body">
      
    <form @submit.prevent="createCard">
    <div class="form_create">
         <label for="name">Добавить заметку:</label>
        <input class="form_input" id="task" v-model="name" required placeholder="task"/>
        <hr>
         <div>
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task1" v-model="name1" required placeholder="task"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input  class="form_input" id="task2" v-model="name2" required placeholder="task"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task3" v-model="name3" required placeholder="task"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task4" v-model="name4" placeholder="task">
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task5" v-model="name5" placeholder="task">
         </div>
<!--        <input @click="createCard" class="ford_submit" type="button" value="Добавить">-->
        <button class="ford_submit">Добавить</button>
     </div>
       </form>
       
       </div>
    </div>
  </div>
</div>
</section>
`,
    data() {
        return {
            name: null,
            name1:null,
            name2:null,
            name3:null,
            name4:null,
            name5:null,
            errors: [],

        }
    },

    methods: {
        createCard() {
            let card = {
                name: this.name,
                arrTask: [ {id: 1, title: this.name1, completed: false},
                    {id: 2, title: this.name2, completed: false},
                    {id: 3, title: this.name3, completed: false},
                    {id: 4, title: this.name4, completed: false},
                    {id: 5, title: this.name5, completed: false},
                ],
                data: null,
                status: 0,
                errors: [],
            }
            eventBus.$emit('card-submitted', card)
            this.name = null
            this.arrTask = null
            this.name1 = null
            this.name2 = null
            this.name3 = null
            this.name4 = null
            this.name5 = null
        },
    },

    props: {
        columnFirst:{
            type: Array,
            required: false,

        },
    },
})
Vue.component('create_card', {
    template: `
<section id="main" class="main-alt">
<div class="form__control">
<modalWindow/>
</div>
</section>
`,
})

let app = new Vue({
    el: '#app',
    data: {

    },
})