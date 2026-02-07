let eventBus = new Vue()
Vue.component('Cards', {
    template: `
       <div class="Cards">
       <h1>Заметки</h1>
       <create_card :disabled="hasActivePriority"></create_card>
       <div v-if="hasActivePriority" style="background-color: #ffebee; color: #c62828; padding: 10px; border-radius: 5px; margin: 15px 0; font-weight: bold;">
         Активна приоритетная карточка! Нельзя создавать новые карточки и взаимодействовать с другими карточками до её завершения.
       </div>
        <p class="error" v-for="error in errors">{{ error }}</p>
           <div class="cards_inner">
                <div class="cards_item">
                    <h2 id="h2_one">Новые</h2>
                    <columns1 
                      :columnFirst="columnFirst" 
                      :hasActivePriority="hasActivePriority"
                      :priorityCardId="priorityCardId"
                    ></columns1>
                </div>
                <div class="cards_item">
                <h2 id="h2_two">В процессе</h2>
                    <columns2 
                      :columnSecond="columnSecond"
                      :hasActivePriority="hasActivePriority"
                      :priorityCardId="priorityCardId"
                    ></columns2>
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
            errors: [],
            priorityCardId: null  // ID приоритетной карточки
        }
    },
    computed: {
        hasActivePriority() {
            return this.priorityCardId !== null;
        }
    },
    mounted() {
        this.loadLocal()
        eventBus.$on('card-submitted', card => {
            this.errors = []
            if (this.hasActivePriority) {
                this.errors.push('Нельзя добавлять новые карточки, пока есть активная приоритетная карточка')
                return
            }
            if(this.columnFirst.length < 3){
                // Добавляем уникальный ID и флаг приоритета при создании карточки
                card.id = Date.now() + Math.random()
                card.isPriority = false
                this.columnFirst.push(card)
            }else {
                this.errors.push('В первой колонке нельзя добавить больше 3-х карточек.')
            }
            this.saveLocal()
        })
        eventBus.$on('addColumnSecond', card => {
            // Блокируем перемещение не-приоритетных карточек если активна приоритетная
            if (this.hasActivePriority && card.id !== this.priorityCardId) return
            
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
            // Блокируем перемещение не-приоритетных карточек если активна приоритетная
            if (this.hasActivePriority && card.id !== this.priorityCardId) return
            
            this.columnThird.push(card)
            this.columnSecond.splice(this.columnSecond.indexOf(card), 1)
            
            // Если перемещаем приоритетную карточку - снимаем приоритет
            if (card.id === this.priorityCardId) {
                this.priorityCardId = null
            }

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
            // Блокируем перемещение не-приоритетных карточек если активна приоритетная
            if (this.hasActivePriority && card.id !== this.priorityCardId) return
            
            if (this.columnSecond.length >= 5) {
                this.errors.push("Вы не можете редактировать первую колонку, пока есть во второй есть 5 карточек")
            } else {
                this.columnThird.push(card)
                this.columnFirst.splice(this.columnFirst.indexOf(card), 1)
                
                // Если перемещаем приоритетную карточку - снимаем приоритет
                if (card.id === this.priorityCardId) {
                    this.priorityCardId = null
                }
            }
            this.saveLocal()
        })
        // Новое событие: установка приоритета
        eventBus.$on('set-priority', card => {
            if (this.hasActivePriority) {
                this.errors.push('Уже есть активная приоритетная карточка. Сначала завершите её.')
                return
            }
            card.isPriority = true
            this.priorityCardId = card.id
            this.saveLocal()
        })
    },
    methods: {
        saveLocal() {
            localStorage.setItem('cards', JSON.stringify({
                columnFirst: this.columnFirst,
                columnSecond: this.columnSecond,
                columnThird: this.columnThird,
                priorityCardId: this.priorityCardId  // Сохраняем ID приоритетной карточки
            }))
        },
        loadLocal() {
            const data = JSON.parse(localStorage.getItem('cards'))
            if (data) {
                this.columnFirst = data.columnFirst || []
                this.columnSecond = data.columnSecond || []
                this.columnThird = data.columnThird || []
                this.priorityCardId = data.priorityCardId || null
                
                // Добавляем ID и флаг приоритета для старых карточек если их нет
                [this.columnFirst, this.columnSecond, this.columnThird].forEach(column => {
                    column.forEach(card => {
                        if (card.id === undefined) card.id = Date.now() + Math.random()
                        if (card.isPriority === undefined) card.isPriority = false
                    })
                })
            }
        },
    },
})

Vue.component('Columns1', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnFirst" :style="card.isPriority && hasActivePriority ? 'border-left: 4px solid red; position: relative;' : ''">
                <div v-if="card.isPriority && hasActivePriority" style="position: absolute; top: -10px; right: -10px; background: red; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">!</div>
                <h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input  
                            :disabled="task.completed || (hasActivePriority && card.id !== priorityCardId)" 
                            @click="updateColumn(card, task)"
                            class="checkbox" type="checkbox"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                    </li>
                </span>
                <button 
                  v-if="!card.isPriority" 
                  @click="setPriority(card)"
                  :disabled="hasActivePriority"
                  style="margin-top: 10px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;"
                >
                  Сделать приоритетной
                </button>
                <div v-else style="margin-top: 10px; padding: 5px 10px; background: #e74c3c; color: white; border-radius: 4px; display: inline-block;">
                  Приоритетная
                </div>
            </div>
       </div>`,

    props: {
        columnFirst:{
            type: Array,
        },
        hasActivePriority: {
            type: Boolean,
            default: false
        },
        priorityCardId: {
            type: [String, Number],
            default: null
        }
    },
    methods: {
        updateColumn(card, task) {
            // Блокируем изменение для не-приоритетных карточек если активна приоритетная
            if (this.hasActivePriority && card.id !== this.priorityCardId) return
            
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
        setPriority(card) {
            eventBus.$emit('set-priority', card)
        }
    },
})

Vue.component('Columns2', {
    template: `
       <div class="Column">
            <div class="column_div" v-for="card in columnSecond" :style="card.isPriority && hasActivePriority ? 'border-left: 4px solid red; position: relative;' : ''">
                <div v-if="card.isPriority && hasActivePriority" style="position: absolute; top: -10px; right: -10px; background: red; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">!</div>
                <h2>{{card.name}}</h2>
                <span>
                    <li v-for="task in card.arrTask" v-if="task.title != null" >
                            <strong>{{task.id}}</strong>
                            <input
                            :disabled="task.completed || (hasActivePriority && card.id !== priorityCardId)" 
                            @click="updateColumnTwo(card, task)"
                            class="checkbox" type="checkbox"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                    </li>
                </span>
                <button 
                  v-if="!card.isPriority" 
                  @click="setPriority(card)"
                  :disabled="hasActivePriority"
                  style="margin-top: 10px; padding: 5px 10px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer;"
                >
                  Сделать приоритетной
                </button>
                <div v-else style="margin-top: 10px; padding: 5px 10px; background: #e74c3c; color: white; border-radius: 4px; display: inline-block;">
                  Приоритетная
                </div>
            </div>
       </div>`,
    props: {
        columnSecond:{
            type: Array,
        },
        hasActivePriority: {
            type: Boolean,
            default: false
        },
        priorityCardId: {
            type: [String, Number],
            default: null
        }
    },
    methods: {
        updateColumnTwo(card, task) {
            // Блокируем изменение для не-приоритетных карточек если активна приоритетная
            if (this.hasActivePriority && card.id !== this.priorityCardId) return
            
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
        setPriority(card) {
            eventBus.$emit('set-priority', card)
        }
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
                            class="checkbox" type="checkbox"
                            >
                            <span :class="{done: task.completed}" >{{task.title}}</span>
                    </li>
                    <p>Дата окончания: <br>{{card.data}}</p>
                </span>
            </div>
       </div>`,
    props: {
        columnThird:{
            type: Array,
        }
    },
    methods: {}
})

Vue.component('modalWindow', {
    template: `
<section>
<div class="bu">
    <a v-if="!disabled" href="#openModal" class="btn btnModal">Создать карточку</a>
    <a v-else href="#openModal" class="btn btnModal" style="background: #bdc3c7; cursor: not-allowed;" @click.prevent>Создать карточку</a>
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
        <input class="form_input" id="task" v-model="name" required placeholder="task" :disabled="disabled"/>
        <hr>
         <div>
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task1" v-model="name1" required placeholder="task" :disabled="disabled"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input  class="form_input" id="task2" v-model="name2" required placeholder="task" :disabled="disabled"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task3" v-model="name3" required placeholder="task" :disabled="disabled"/>
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task4" v-model="name4" placeholder="task" :disabled="disabled">
         </div>
         <div class="form_div">
             <label for="name">Добавить задачу:</label>
             <input class="form_input" id="task5" v-model="name5" placeholder="task" :disabled="disabled">
         </div>
        <button class="ford_submit" :disabled="disabled">Добавить</button>
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
    props: {
        disabled: {
            type: Boolean,
            default: false
        }
    },
    methods: {
        createCard() {
            if (this.disabled) return
            
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
                // ID и флаг приоритета будут добавлены в обработчике 'card-submitted'
            }
            eventBus.$emit('card-submitted', card)
            this.name = null
            this.name1 = null
            this.name2 = null
            this.name3 = null
            this.name4 = null
            this.name5 = null
        },
    },
})
Vue.component('create_card', {
    template: `
<section id="main" class="main-alt">
<div class="form__control">
<modalWindow :disabled="disabled"/>
</div>
</section>
`,
    props: {
        disabled: {
            type: Boolean,
            default: false
        }
    }
})
let app = new Vue({
    el: '#app',
    data: {},
})