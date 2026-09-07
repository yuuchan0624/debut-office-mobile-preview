(function () {
  "use strict";

  var SETTINGS_KEY = "eve-rookie-debut-v2-settings";
  var BACKUP_KEY = "eve-rookie-debut-v2-backup";
  var DAY_MS = 86400000;
  var PLAN_WEIGHT_DECIMALS = 2;
  var DEFAULT_WATER_GOAL_ML = 2000;
  var MIN_DAILY_TASKS = 2;
  var MAX_CUSTOM_TASKS = 5;
  var DATA_EXPORT_HEADER = "DEBUT_OFFICE_BACKUP_V1";
  var DATA_EXPORT_APP = "eve-rookie-debut-minitool";
  var MEAL_KEYS = ["breakfast", "lunch", "dinner"];
  var MEAL_LABELS = { breakfast: "早餐", lunch: "午餐", dinner: "晚餐" };
  var BUILT_IN_CALL_TASKS = {
    meals: { label: "三餐如实记录", icon: "utensils", color: "coral" },
    workout: { label: "今日运动", icon: "dumbbell", color: "blue" },
    water: { label: "今日喝水", icon: "glass-water", color: "water" },
    measurements: { label: "每日围度", icon: "ruler", color: "measurement" }
  };
  var WORKOUT_SUGGESTIONS = ["快走", "慢跑", "跳操", "骑行", "力量训练", "瑜伽", "普拉提", "游泳", "羽毛球"];
  var STATUS_LABELS = { baseline: "基线", achieved: "达标", progress: "推进", behind: "落后", maintenance: "达标" };
  var FAN_STAGE_RANGES = {
    early: { morningGain: [300, 800], progressLoss: [30, 100], behindLoss: [100, 300], longPenalty: [500, 1200], mealGain: [40, 100], workoutGain: [150, 350], waterGain: [40, 100], photoGain: [80, 180] },
    middle: { morningGain: [800, 1800], progressLoss: [100, 300], behindLoss: [300, 800], longPenalty: [1200, 2500], mealGain: [120, 260], workoutGain: [400, 900], waterGain: [120, 260], photoGain: [200, 500] },
    sprint: { morningGain: [1800, 3500], progressLoss: [300, 700], behindLoss: [800, 1800], longPenalty: [2500, 5000], mealGain: [250, 500], workoutGain: [900, 1800], waterGain: [250, 500], photoGain: [500, 1000] },
    debut: { morningGain: [5000, 12000], progressLoss: [500, 1000], behindLoss: [1000, 2500], longPenalty: [3000, 6000], mealGain: [400, 800], workoutGain: [1500, 3000], waterGain: [400, 800], photoGain: [800, 1600] }
  };
  var activeMeal = "";
  var pendingMealPhoto = "";
  var pendingAvatar = "";
  var pendingBusinessPhoto = "";
  var onboardingDraft = null;
  var workoutPlanDraft = [];
  var callSheetDraft = [];
  var dailyHistory = [];
  var todayRecord = null;
  var storageAvailable = false;
  var toastTimer = null;
  var confirmHandler = null;
  var currentHistoryRecord = null;
  var autoSettlementPrompted = false;
  var legacyRepairPrompted = false;

  var FAN_NAMES = [
    "出道倒计时站", "今天也等姐姐", "练习室前排", "薄荷色应援", "首舞台预约", "LUMI宇宙站",
    "小岛放映厅", "星星存档员", "日常放送观众", "今日生存日志", "下班来看更新", "第一次追新人",
    "首排摄影机", "等一条泡泡", "应援棒充电中", "只看这个频道", "蓝色练习册", "姐姐请幸福",
    "出道日见面", "月亮值班室", "云朵留言处", "练习室夜班", "柠檬汽水站", "彩纸准备中",
    "stagecam", "rookie_note", "firstrow_01", "dayone_fan", "debut_waiting", "camera_ready",
    "dailyencore", "orbit_note", "mintchoco", "bluehour", "afterglow", "silverframe",
    "frontrow_02", "starrymemo", "debutarchive", "waitingroom", "sundayfilm", "melodyloop",
    "limeplaylist", "polaroid_day", "concertdream", "firstcheer", "neonpractice", "moonlitfile"
  ];
  var FAN_COMMENTS = {
    early: [
      "刚刷到姐姐的新人档案，前排位置先替我留着。",
      "姐姐慢慢练，我们慢慢认识，第一次舞台见。",
      "我的眼睛本来是 OvO 的样子，看到你就变成了 ♡v♡。",
      "宝宝你又忘打标签了：#新人爱豆 #卡哇伊 #全网最萌 #萌届一把刀 #香香软软糯糯小蛋糕 #天真 #可爱 #善良",
      "这是哪位会让地球转快一点的新人？先关注了。",
      "今天靠这条训练更新成功存活，生存日记打卡完毕。",
      "第一份训练记录收到了，怎么连认真都这么可爱。",
      "从零开始追好有参与感，我要做第一批元老粉。",
      "练习室的灯亮了，我也来报到。今天辛苦啦。",
      "新人姐姐放心往前走，这里已经有人等你的舞台了。",
      "你一出现，今天的幸福指数就偷偷升了一格。",
      "先把名字记住，等姐姐出道那天来验收我的眼光。"
    ],
    middle: [
      "不知不觉已经每天等姐姐更新了，这算训练期上瘾吗。",
      "从第一周看到现在，真的慢慢长出了自己的节奏。",
      "看到姐姐一点点变稳，比任何漂亮数字都更让人开心。",
      "今天也来报到了，今日份小幸福已签收。",
      "平凡的一天和你连上线，也突然变得特别了。",
      "训练日志又更新，我的日常充电器准时上线。",
      "不用每天都完美，愿意回来记录就很厉害。",
      "从新人档案追到现在，已经舍不得漏看一条。",
      "很久没看见过这么纯粹的训练记录了，根本不经过大脑的计算，毫无博弈可言，完全抛开了技巧，所有操作都来自想出道的本能。这才是纯粹的战斗，看得我酣畅淋漓，暂时忘记了当今社会的尔虞我诈。",
      "这位新人到底怎么做到又认真又可爱的，合理怀疑是天才。",
      "我把你的出道日记进日历了，中途也会一直在。",
      "全世界的频道好像都调到你这里了，今天也收到信号。"
    ],
    sprint: [
      "姐姐离第一次舞台只差一点点了，我比自己考试还紧张。",
      "一路陪到冲刺期，谁懂元老粉马上要见证出道的心情。",
      "姐姐别在最后几天乱加量，稳稳走上舞台就已经很好。",
      "应援和尖叫都准备好了，你只管照顾好自己。",
      "倒计时越短越舍不得眨眼，每条更新都要收藏。",
      "今天也来写生存日志了，下一站就是正式舞台。",
      "从练习室到舞台的距离快要归零啦，真的会幸福到哭。",
      "谁允许你把冲刺期也过得这么漂亮，完全是 legend。",
      "最后阶段也要好好吃饭睡觉，粉丝想看的是健康的姐姐。",
      "首舞台我已经在脑内彩排一百遍了。",
      "今天的频率对上了：你稳稳训练，我们稳稳等待。",
      "出道日快来吧，我的应援棒已经提前上班了。"
    ],
    cold: [
      "姐姐最近是不是有点累？先把状态照顾好，我们等你回来。",
      "这几次更新的节奏乱了，还是希望你别一个人硬撑。",
      "没完成也可以说实话，姐姐愿意回来记录就好。",
      "今天有点可惜，但别用不吃饭惩罚自己，明天重新来。",
      "先完成最基础的一小步，别急着一口气追回全部。",
      "这几天安静了好多，我还在等下一条训练消息。",
      "姐姐的身体比排期重要，先吃饭、睡觉，再慢慢找回节奏。",
      "不用假装状态很好，真实的训练期也有人愿意陪。",
      "今天没跟上没关系，别让一次落后变成不敢回来。",
      "姐姐回来就好，我们从一顿饭和一次记录重新开始。",
      "有点担心你，明天记得来报个平安。",
      "训练不是只准成功的故事，认真面对今天也算前进。"
    ],
    debut: [
      "姐姐真的出道了！从第一份档案追到现在，我眼光果然没错。",
      "今天全宇宙的频道都应该只播这场首舞台。",
      "新人企划毕业，正式故事现在才开始。",
      "从零粉丝陪到出道，我要把元老粉证件焊在主页。",
      "今天完全是 legend，幸福指数直接冲到顶。",
      "第一份正式档案已收藏，每一步都没有白走。",
      "终于可以大声说：这是我从训练期就喜欢的姐姐。",
      "姐姐的首舞台请放心发光，我们负责把应援送到。",
      "今天靠正式出道这条消息成功存活，生存日志圆满完成。",
      "练习室的灯没有白亮，真的一步一步走到了舞台上。",
      "姐姐以后也请一直幸福地走下去，下一次舞台继续见。",
      "不是终点，是我们第一次正式见面的日子。"
    ]
  };

  var FAN_CONTEXT_COMMENTS = {
    general: [
      "今日数据：理智 -100，关注 +1，出道期待值已溢出。",
      "刚才还在过普通人生，刷到这里之后突然拥有了应援主线。",
      "请问新人档案可以作为精神补剂计入每日营养摄入吗。",
      "地球正常转没转我不知道，反正我的首页已经开始围着你公转了。",
      "本人只是路过，为什么现在已经在查出道日请假攻略了。",
      "看到更新前：今天好累。看到更新后：感觉还能再活五百年。",
      "科学暂时无法解释我为什么会对一份新人档案产生如此强烈的归属感。",
      "这条更新涉嫌非法提高幸福指数，证据确凿，建议永久保留。",
      "我本来是有原则的，你一出现，原则说它先下班了。",
      "已读，已关注，已擅自成为元老粉。",
      "你负责训练，我负责把这件事告诉全宇宙，分工非常合理。",
      "本来只是随便看看，现在已经发展到每天检查新人企划施工进度。"
    ],
    training: [
      "练习室的灯一亮，我的互联网人生就自动加载了主线任务。",
      "别人训练是训练，你训练像在给我的生活安装幸福更新包。",
      "这不是训练记录，这是新人爱豆养成进度条，我已经蹲在旁边不走了。",
      "每天来交训练作业看似朴素，实际上已经精准控制了我的多巴胺供应。",
      "请保持这种不经意的更新，我这边会负责郑重其事地收藏。",
      "今日训练完成度暂且不论，今日可爱度已经超出系统上限。",
      "我的脑子说追新人要谨慎，我的手说先点关注，之后的事之后再说。",
      "建议立刻停止散发新人感，因为我已经开始产生从第一天陪到出道的责任心。"
    ],
    photo: [
      "很久没看见过这种纯粹的萌图了，根本不经过大脑的思考，毫无博弈可言，完全抛开了技巧，所有的操作都来自人类爱上萌图的本能。这才是纯粹的战斗，看得我酣畅淋漓，暂时忘记了当今社会的尔虞我诈。",
      "这张营业照对我造成了工伤，现在无法正常工作，只能反复查看。",
      "摄影师按下快门的那一刻，世界上又少了一个理智的人，就是我。",
      "请问这是公开营业照，还是针对我的定向情绪攻击。",
      "本来只是来检查今天有没有营业，结果被营业对象当场扣留。",
      "图片加载成功，语言功能加载失败，目前只能发出一些没有意义的感叹。",
      "建议下次发照片前标注高能，我的情绪系统没有安装缓冲装置。"
    ],
    completed: [
      "三项作业全部交齐，本人宣布今日新人训练工程顺利竣工。",
      "你这个完成度很危险，再这样下去真的会顺利出道。",
      "别人打卡累积天数，你打卡累积我的感情，性质完全不同。",
      "今日生存日志：本人靠一条训练结算成功续费。",
      "完成任务这件事被你做得像舞台 ending，我已经在屏幕前自动鼓掌。",
      "今天不是普通的一天，是值得被写进新人训练野史的一天。",
      "理智建议我冷静，完成度建议我立刻制作应援横幅。",
      "训练档案已经封存，本人的情绪并没有封存，目前仍在持续沸腾。",
      "任务完成，粉丝到账，我的快乐形成了完整商业闭环。",
      "经纪人负责验收训练，我负责在评论区进行无意义但热烈的庆祝。"
    ],
    sprint: [
      "倒计时每少一天，我的精神状态就会自动多出一个感叹号。",
      "出道日还没到，我已经在脑内看完首舞台、返场和谢幕了。",
      "建议时间立刻快进到第一次舞台，我这边已经没有耐心继续假装冷静。",
      "今天全宇宙的频道都应该暂停原定节目，统一等待新人出道。",
      "从训练第一天看到现在，我不是普通粉丝，我是企划历史见证人。",
      "本人郑重声明，这不是追星上头，这是对优质新人项目的长期战略关注。",
      "元老粉证件已经打印完毕，出道当天请直接安排我入场。",
      "不是你要出道，是我的互联网人生终于要迎来阶段性成果。",
      "姐姐只管走上舞台，我会负责在台下失去语言组织能力。",
      "练习室的灯终于一路亮到了舞台上，我宣布这个世界今天值得原谅。"
    ]
  };

  var MANAGER_MESSAGE_LIBRARY = {
    newcomer: {
      baseline: [
        "新人第一天，先别跟数字较劲。把三餐、运动和记录走完整，我要看的是你能不能稳稳开始。",
        "今天先熟悉节奏：好好吃饭，按计划动一动，晚上回来收尾。出道训练不是靠一天拼命。"
      ],
      achieved: [
        "开局守住了，做得不错。今天照原计划走，不许因为一次达标临时少吃或加练。",
        "第一天的计划线过了。把这份认真留给明天，别急着一次把三十天都做完。"
      ],
      progress: [
        "方向是对的，只是还差计划线一点。今天把该吃的吃、该动的动，不用补课。",
        "有在往前走，我看到了。先把今天三项通告做完整，速度不用靠极端办法换。"
      ],
      behind: [
        "第一天有波动很正常，别先给自己判失败。今天从三餐和原定运动重新开始。",
        "今天没赶上计划线。先把节奏找回来，不准靠少吃一顿补数字。"
      ]
    },
    day3: {
      baseline: [
        "第三天，新鲜感差不多该退场了。今天还是按时吃饭、训练、记录，我开始看你的稳定性。",
        "前三天不是考试，是在找能坚持的节奏。今天把流程再走顺一点。"
      ],
      achieved: [
        "三天节点守住了。很好，奖励进度也记上了，但今天不追加任何任务。",
        "第三天还认真出现，这比一个漂亮数字更重要。照昨天的节奏继续。"
      ],
      progress: [
        "三天里一直在往前，只是还没追上计划线。别着急，睡眠和三餐也要一起守住。",
        "方向没错，差的是稳定完成。今天先把基础通告一项不少地做完。"
      ],
      behind: [
        "第三天还没跟上，我会提醒你，但不许乱补。今天先恢复完整记录。",
        "这几天节奏有点散。别少吃，也别突然加练，从最基础的任务重新站稳。"
      ]
    },
    day7: {
      baseline: [
        "第一周到了。接下来不能只靠刚开始的兴奋，得把训练变成日常。",
        "七天报到。先回头看哪一项最容易漏，今天把它提前安排好。"
      ],
      achieved: [
        "第一周计划线守住了。值得肯定，但今天仍按原强度，别把达标变成加码理由。",
        "七天合格。你已经证明自己能开始，下一周我要看你能不能舒服地持续。"
      ],
      progress: [
        "第一周有前进，只是离排期还差一点。第二周稳住完成率，别追求突然下降。",
        "方向正确，节奏还可以再整齐些。今天从按时吃饭和完成运动开始。"
      ],
      behind: [
        "第一周没过计划线。先找出最常漏的任务，不要把问题全归到体重上。",
        "七天进度落后了。今天不加练，恢复三餐、运动和睡眠，先把生活拉回正轨。"
      ]
    },
    day14: {
      baseline: [
        "两周了，新鲜感已经过去。能把普通的一天也认真过完，才是真的训练。",
        "第十四天。今天不用做得惊天动地，按时完成就够了。"
      ],
      achieved: [
        "两周计划线守住了。做得好，继续维持同样强度，不要再往更低的数字压。",
        "第十四天达标。你正在把训练变成习惯，今天也按正常节奏吃、练、睡。"
      ],
      progress: [
        "两周有稳定前进，但排期还差一点。后半程先提高完成率，不用突然收紧饮食。",
        "方向对，差距还在。把今天能控制的三件事做好，剩下的交给时间。"
      ],
      behind: [
        "中段进度落后了，先别慌。今天把执行恢复完整，不能靠挨饿追赶。",
        "两周节点没跟上。我们调整节奏，不惩罚身体，先把三餐和睡眠守住。"
      ]
    },
    day21: {
      baseline: [
        "第三周开始，舞台真的近了。越到后面越要稳，别临时改变自己的节奏。",
        "二十一天报到。现在不拼兴奋，拼的是还能不能好好完成普通的一天。"
      ],
      achieved: [
        "第三周计划线守住了。冲刺期最怕乱加码，今天照既定安排走。",
        "二十一天达标。状态很好，接下来只要稳住，不需要证明得更多。"
      ],
      progress: [
        "已经进冲刺期了，方向还在前进，只差计划线一点。今天别漏基础任务。",
        "第三周有进展，排期仍有差距。把今天完整做完，不临时加练。"
      ],
      behind: [
        "冲刺期还没跟上，但现在更不能乱来。今天三餐、运动和睡眠一项都别丢。",
        "二十一天节点落后。先停住混乱，不许用极端方式追赶，我们按原计划走。"
      ]
    },
    day30: {
      baseline: [
        "最后一个训练日到了。今天不追加要求，把真实状态和最后一份记录交给我。",
        "最终日，先把今天好好过完。结果等收尾后一起看。"
      ],
      achieved: [
        "三十天计划线守住了。做得漂亮，今天正常吃饭、正常收尾，不再压数字。",
        "最终日达标。把三餐、运动和营业照收好，准备去见第一批等你的粉丝。"
      ],
      progress: [
        "最后一天还在往前，只是没有完全到线。别否定这三十天，先如实完成记录。",
        "你走到了最后一天，每一次回来都算数。今天把能完成的部分认真收好。"
      ],
      behind: [
        "最终节点没有过线，也不准临时伤身体。把真实结果交给我，我们再决定下一步。",
        "三十天到了，差距还在。今天不做极端补救，完整记录就是最后任务。"
      ]
    }
  };

  function createDefaultState() {
    return {
      version: 6,
      onboardingComplete: false,
      trainingStarted: false,
      tutorialSeen: false,
      tutorialPending: false,
      activeView: "profile",
      profile: {
        name: "LUMI",
        height: null,
        favoriteFoods: ["冰淇淋"],
        avatar: "",
        startWeight: null,
        targetWeight: null,
        maintenanceCenter: null,
        mode: "loss",
        needsTargetRepair: false,
        startDate: "",
        debutDate: ""
      },
      plan: {
        id: "",
        status: "draft",
        targetEditUsed: false,
        dateEditUsed: false,
        lastWorkoutPlan: { type: "快走", custom: "", minutes: 20 },
        lastWorkoutGoals: [{ id: "default-walk", type: "快走", minutes: 20 }],
        lastCallSheetTemplate: defaultCallSheetTemplate(),
        lastWaterGoalMl: DEFAULT_WATER_GOAL_ML,
        lastActualWorkoutType: "",
        extensionCount: 0
      },
      fans: 0,
      streak: 0,
      behindStreak: 0,
      rewardProgress: 0,
      rewards: [],
      managerMessages: [],
      dataBackup: { lastExportDate: "", lastExportedAt: "" },
      pendingCarryover: null,
      outcome: null,
      pastPlans: []
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    var base = createDefaultState();
    try {
      var saved = window.localStorage.getItem(SETTINGS_KEY);
      if (!saved) return base;
      var parsed = JSON.parse(saved);
      var savedPlan = parsed.plan || {};
      var legacyWorkoutPlan = Object.assign({}, base.plan.lastWorkoutPlan, savedPlan.lastWorkoutPlan || {});
      var savedWorkoutGoals = Array.isArray(savedPlan.lastWorkoutGoals) && savedPlan.lastWorkoutGoals.length
        ? savedPlan.lastWorkoutGoals
        : [{ id: "legacy-default", type: workoutName(legacyWorkoutPlan) || "快走", minutes: Number(legacyWorkoutPlan.minutes || 20) }];
      var loaded = Object.assign(base, parsed, {
        profile: Object.assign(base.profile, parsed.profile || {}),
        plan: Object.assign(base.plan, savedPlan, {
          lastWorkoutPlan: legacyWorkoutPlan,
          lastWorkoutGoals: normalizeWorkoutGoalTemplates(savedWorkoutGoals),
          lastCallSheetTemplate: normalizeCallSheetTemplates(savedPlan.lastCallSheetTemplate),
          lastWaterGoalMl: normalizeWaterGoal(savedPlan.lastWaterGoalMl)
        }),
        dataBackup: Object.assign(base.dataBackup, parsed.dataBackup || {}),
        rewards: Array.isArray(parsed.rewards) ? parsed.rewards : [],
        managerMessages: Array.isArray(parsed.managerMessages) ? parsed.managerMessages : [],
        pastPlans: Array.isArray(parsed.pastPlans) ? parsed.pastPlans : []
      });
      if (Number(parsed.version || 2) < 3 && loaded.profile.mode === "maintenance") {
        loaded.profile.needsTargetRepair = true;
        loaded.plan.targetEditUsed = false;
      }
      loaded.version = 6;
      return loaded;
    } catch (error) {
      return base;
    }
  }

  var state = loadState();

  function saveSettings() {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      showToast("本地空间不足，请减少照片后重试");
      return false;
    }
  }

  function safeImportedImage(value) {
    var image = String(value || "");
    return /^data:image\/(?:jpeg|png|webp|gif);base64,/i.test(image) ? image : "";
  }

  function normalizeImportedState(source) {
    var base = createDefaultState();
    var imported = source && typeof source === "object" ? source : {};
    var profile = imported.profile && typeof imported.profile === "object" ? imported.profile : {};
    var plan = imported.plan && typeof imported.plan === "object" ? imported.plan : {};
    base.onboardingComplete = Boolean(imported.onboardingComplete);
    base.trainingStarted = Boolean(imported.trainingStarted);
    base.tutorialSeen = Boolean(imported.tutorialSeen);
    base.tutorialPending = Boolean(imported.tutorialPending);
    base.activeView = ["today", "record", "progress", "profile"].includes(imported.activeView) ? imported.activeView : "today";
    base.profile = {
      name: String(profile.name || "LUMI").slice(0, 12),
      height: Number(profile.height || 0),
      favoriteFoods: (Array.isArray(profile.favoriteFoods) ? profile.favoriteFoods : []).map(function (food) { return String(food || "").trim().slice(0, 16); }).filter(Boolean).slice(0, 3),
      avatar: safeImportedImage(profile.avatar),
      startWeight: Number(profile.startWeight || 0),
      targetWeight: Number(profile.targetWeight || 0),
      maintenanceCenter: profile.maintenanceCenter === null ? null : Number(profile.maintenanceCenter || 0),
      mode: profile.mode === "maintenance" ? "maintenance" : "loss",
      needsTargetRepair: Boolean(profile.needsTargetRepair),
      startDate: String(profile.startDate || ""),
      debutDate: String(profile.debutDate || "")
    };
    base.plan = {
      id: String(plan.id || "plan-imported").slice(0, 80),
      status: ["draft", "active", "extension", "complete"].includes(plan.status) ? plan.status : "active",
      targetEditUsed: Boolean(plan.targetEditUsed),
      dateEditUsed: Boolean(plan.dateEditUsed),
      lastWorkoutPlan: Object.assign({}, base.plan.lastWorkoutPlan, plan.lastWorkoutPlan || {}),
      lastWorkoutGoals: normalizeWorkoutGoalTemplates(plan.lastWorkoutGoals),
      lastCallSheetTemplate: normalizeCallSheetTemplates(plan.lastCallSheetTemplate),
      lastWaterGoalMl: normalizeWaterGoal(plan.lastWaterGoalMl),
      lastActualWorkoutType: String(plan.lastActualWorkoutType || "").slice(0, 30),
      extensionCount: Math.max(0, Math.round(Number(plan.extensionCount || 0)))
    };
    if (!base.plan.lastWorkoutGoals.length) base.plan.lastWorkoutGoals = clone(createDefaultState().plan.lastWorkoutGoals);
    base.fans = Math.max(0, Math.round(Number(imported.fans || 0)));
    base.streak = Math.max(0, Math.round(Number(imported.streak || 0)));
    base.behindStreak = Math.max(0, Math.round(Number(imported.behindStreak || 0)));
    base.rewardProgress = Math.max(0, Math.min(2, Math.round(Number(imported.rewardProgress || 0))));
    base.rewards = Array.isArray(imported.rewards) ? imported.rewards.slice(0, 60) : [];
    base.managerMessages = Array.isArray(imported.managerMessages) ? imported.managerMessages.slice(0, 60).map(function (message) {
      return { id: String(message.id || ""), date: String(message.date || ""), side: message.side === "self" ? "self" : "manager", time: String(message.time || "").slice(0, 30), text: String(message.text || "").slice(0, 300) };
    }) : [];
    base.dataBackup = Object.assign(base.dataBackup, imported.dataBackup || {});
    base.pendingCarryover = imported.pendingCarryover && typeof imported.pendingCarryover === "object" ? imported.pendingCarryover : null;
    base.outcome = imported.outcome && typeof imported.outcome === "object" ? imported.outcome : null;
    base.pastPlans = Array.isArray(imported.pastPlans) ? imported.pastPlans.slice(-8) : [];
    base.version = 6;
    return base;
  }

  function validateImportedArchive(payload) {
    if (!payload || payload.app !== DATA_EXPORT_APP || Number(payload.schemaVersion) !== 1) throw new Error("这不是本工具导出的 TXT 存档");
    if (!payload.state || !payload.state.onboardingComplete || !Array.isArray(payload.records)) throw new Error("存档内容不完整，请重新选择文件");
    var importedState = normalizeImportedState(payload.state);
    if (!parseDate(importedState.profile.startDate) || !parseDate(importedState.profile.debutDate) || !importedState.profile.height || !importedState.profile.startWeight) throw new Error("存档中的新人资料不完整");
    return { state: importedState, records: payload.records.slice(0, 60) };
  }

  function readTextFile(file) {
    if (file && typeof file.text === "function") return file.text();
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(new Error("文件读取失败")); };
      reader.readAsText(file, "utf-8");
    });
  }

  async function exportDataArchive(downloadOnly) {
    var exportedAt = new Date().toISOString();
    var exportedState = clone(state);
    exportedState.dataBackup = { lastExportDate: todayValue(), lastExportedAt: exportedAt };
    var payload = {
      app: DATA_EXPORT_APP,
      schemaVersion: 1,
      exportedAt: exportedAt,
      state: exportedState,
      records: dailyHistory.slice(0, 60).map(function (record) { return clone(normalizeDailyRecord(record)); })
    };
    var content = DATA_EXPORT_HEADER + "\n" + JSON.stringify(payload);
    var filename = "新人出道减肥计划.txt";
    var file = new File([content], filename, { type: "text/plain" });
    var shared = false;
    if (downloadOnly !== true && navigator.share && navigator.canShare) {
      try {
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file] });
          shared = true;
        }
      } catch (error) {
        if (error && error.name === "AbortError") return;
      }
    }
    if (!shared) {
      var url = URL.createObjectURL(file);
      var anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
    }
    state.dataBackup = { lastExportDate: todayValue(), lastExportedAt: exportedAt };
    saveSettings();
    renderDataBackupStatus();
    showToast(shared ? "存档已生成，请在系统面板中保存" : "TXT 存档已生成");
  }

  function parseArchiveText(text) {
    var source = String(text || "").replace(/^\uFEFF/, "").trim();
    if (source.indexOf(DATA_EXPORT_HEADER) === 0) source = source.slice(DATA_EXPORT_HEADER.length).trim();
    return JSON.parse(source, function (key, value) {
      return key === "__proto__" || key === "prototype" || key === "constructor" ? undefined : value;
    });
  }

  async function applyImportedArchive(archive) {
    state = archive.state;
    dailyHistory = archive.records.map(function (record) {
      if (record && record.meals) MEAL_KEYS.forEach(function (key) { if (record.meals[key]) record.meals[key].photo = safeImportedImage(record.meals[key].photo); });
      if (record) record.businessPhoto = safeImportedImage(record.businessPhoto);
      return normalizeDailyRecord(record);
    }).filter(function (record) { return record && parseDate(record.date); }).sort(function (a, b) { return b.date.localeCompare(a.date); }).slice(0, 60);
    window.localStorage.removeItem(BACKUP_KEY);
    saveSettings();
    dailyHistory.slice(0, 7).forEach(saveBackup);
    if (window.EveDailyStore) {
      try {
        await window.EveDailyStore.open();
        await window.EveDailyStore.clear();
        for (var index = 0; index < dailyHistory.length; index += 1) await window.EveDailyStore.putDay(clone(dailyHistory[index]));
        storageAvailable = true;
      } catch (error) {
        storageAvailable = false;
      }
    }
    window.location.reload();
  }

  async function handleDataImport(file) {
    if (!file) return;
    if (file.size > 80 * 1024 * 1024) {
      showToast("存档文件过大，请选择本工具导出的 TXT");
      return;
    }
    try {
      var archive = validateImportedArchive(parseArchiveText(await readTextFile(file)));
      if (!state.onboardingComplete) {
        await applyImportedArchive(archive);
        return;
      }
      askConfirmation("导入并替换当前档案？", "将恢复 TXT 中的新人资料和逐日记录，当前设备上的档案会被替换。", "确认导入", function () {
        closeConfirmation();
        applyImportedArchive(archive);
      });
    } catch (error) {
      showToast(error && error.message ? error.message : "存档读取失败，请重新选择");
    }
  }

  function renderDataBackupStatus() {
    var backup = state.dataBackup || {};
    var summary = backup.lastExportDate ? "最近导出 " + formatShortDate(backup.lastExportDate) : "用 TXT 保存并恢复训练档案";
    setText("profileBackupSummary", summary);
    setText("dataBackupStatus", backup.lastExportDate ? "最近一次导出：" + formatFullDate(backup.lastExportDate) : "尚未在本设备导出过存档");
  }

  function openDataBackupSheet() {
    renderDataBackupStatus();
    openSheet("dataSheet");
  }

  function pad(value) {
    return String(value).padStart(2, "0");
  }

  function toDateValue(date) {
    return date.getFullYear() + "-" + pad(date.getMonth() + 1) + "-" + pad(date.getDate());
  }

  function parseDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    var parts = value.split("-").map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2], 12, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function todayValue() {
    var now = new Date();
    try {
      var parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        hourCycle: "h23"
      }).formatToParts(now).reduce(function (result, part) {
        if (part.type !== "literal") result[part.type] = part.value;
        return result;
      }, {});
      var trainingDate = new Date(Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day)));
      if (Number(parts.hour) < 6) trainingDate.setUTCDate(trainingDate.getUTCDate() - 1);
      return trainingDate.getUTCFullYear() + "-" + pad(trainingDate.getUTCMonth() + 1) + "-" + pad(trainingDate.getUTCDate());
    } catch (error) {
      if (now.getHours() < 6) now.setDate(now.getDate() - 1);
      return toDateValue(now);
    }
  }

  function addDays(value, count) {
    var date = typeof value === "string" ? parseDate(value) : new Date(value.getTime());
    date.setDate(date.getDate() + Number(count || 0));
    return toDateValue(date);
  }

  function daysBetween(fromValue, toValue) {
    var from = parseDate(fromValue);
    var to = parseDate(toValue);
    if (!from || !to) return 0;
    return Math.round((to.getTime() - from.getTime()) / DAY_MS);
  }

  function daysUntil(value) {
    return Math.max(0, daysBetween(todayValue(), value));
  }

  function formatShortDate(value) {
    var date = parseDate(value);
    return date ? (date.getMonth() + 1) + "月" + date.getDate() + "日" : "待确定";
  }

  function formatFullDate(value) {
    var date = parseDate(value);
    return date ? date.getFullYear() + "." + pad(date.getMonth() + 1) + "." + pad(date.getDate()) : "----.--.--";
  }

  function formatDateLabel(value) {
    var date = parseDate(value) || new Date();
    var weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
    return (date.getMonth() + 1) + "月" + date.getDate() + "日 · " + weekdays[date.getDay()];
  }

  function formatFans(value) {
    return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(Number(value || 0))));
  }

  function signedNumber(value) {
    var number = Math.round(Number(value || 0));
    if (number < 0) return "-" + formatFans(Math.abs(number));
    return (number > 0 ? "+" : "") + formatFans(number);
  }

  function setText(id, value) {
    var element = document.getElementById(id);
    if (element) element.textContent = value;
  }

  function setHidden(id, hidden) {
    var element = document.getElementById(id);
    if (element) element.hidden = Boolean(hidden);
  }

  function hashString(value) {
    var hash = 2166136261;
    for (var index = 0; index < value.length; index += 1) {
      hash ^= value.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function seededRange(date, channel, minimum, maximum) {
    var seed = [state.plan.id || "draft", date || todayValue(), channel].join("|");
    var ratio = hashString(seed) / 4294967295;
    return Math.round(minimum + (maximum - minimum) * ratio);
  }

  function seededShuffle(items, date, channel) {
    var result = items.slice();
    var seed = hashString([state.plan.id || "draft", date || todayValue(), channel].join("|"));
    for (var index = result.length - 1; index > 0; index -= 1) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      var target = seed % (index + 1);
      var current = result[index];
      result[index] = result[target];
      result[target] = current;
    }
    return result;
  }

  function createEmptyMeals() {
    return {
      breakfast: { logged: false, note: "", photo: "", calories: null },
      lunch: { logged: false, note: "", photo: "", calories: null },
      dinner: { logged: false, note: "", photo: "", calories: null }
    };
  }

  function defaultCallSheetTemplate() {
    return ["meals", "workout", "water"].map(function (kind) {
      return { id: kind, kind: kind, label: BUILT_IN_CALL_TASKS[kind].label };
    });
  }

  function normalizeWaterGoal(value) {
    var goal = Math.round(Number(value || DEFAULT_WATER_GOAL_ML));
    return Math.max(300, Math.min(5000, goal));
  }

  function normalizeMeasurementValue(value) {
    if (value === null || value === "" || typeof value === "undefined") return null;
    var number = Number(value);
    return Number.isFinite(number) && number > 0 ? Math.round(number * 10) / 10 : null;
  }

  function normalizeMeasurements(measurements) {
    var source = measurements && typeof measurements === "object" ? measurements : {};
    return {
      waist: normalizeMeasurementValue(source.waist),
      thigh: normalizeMeasurementValue(source.thigh),
      calf: normalizeMeasurementValue(source.calf),
      bust: normalizeMeasurementValue(source.bust),
      otherName: String(source.otherName || "").trim().slice(0, 12),
      otherValue: normalizeMeasurementValue(source.otherValue)
    };
  }

  function normalizeCallSheetTemplates(tasks) {
    var source = Array.isArray(tasks) ? tasks : defaultCallSheetTemplate();
    var builtInSeen = {};
    var customCount = 0;
    var result = [];
    source.forEach(function (task, index) {
      if (!task || typeof task !== "object") return;
      var kind = String(task.kind || task.id || "").trim();
      if (BUILT_IN_CALL_TASKS[kind]) {
        if (builtInSeen[kind]) return;
        builtInSeen[kind] = true;
        result.push({ id: kind, kind: kind, label: BUILT_IN_CALL_TASKS[kind].label });
        return;
      }
      if (kind !== "custom" || customCount >= MAX_CUSTOM_TASKS) return;
      var label = String(task.label || "").trim().slice(0, 20);
      if (!label) return;
      customCount += 1;
      result.push({ id: String(task.id || "custom-template-" + index), kind: "custom", label: label });
    });
    defaultCallSheetTemplate().forEach(function (task) {
      if (result.length < MIN_DAILY_TASKS && !result.some(function (item) { return item.kind === task.kind; })) result.push(task);
    });
    return result;
  }

  function normalizeCallSheetForRecord(tasks, date) {
    return normalizeCallSheetTemplates(tasks).map(function (task, index) {
      if (task.kind !== "custom") return { id: task.kind, kind: task.kind, label: task.label, completed: false };
      var source = (Array.isArray(tasks) ? tasks : []).find(function (item) {
        return item && String(item.id || "") === String(task.id || "");
      });
      return {
        id: String(task.id || date + "-custom-" + index + "-" + hashString(task.label)),
        kind: "custom",
        label: task.label,
        completed: Boolean(source && source.completed)
      };
    });
  }

  function createCallSheetForDay(date) {
    var templates = normalizeCallSheetTemplates(state.plan.lastCallSheetTemplate);
    return templates.map(function (task, index) {
      return task.kind === "custom"
        ? { id: date + "-custom-" + index + "-" + hashString(task.label), kind: "custom", label: task.label, completed: false }
        : { id: task.kind, kind: task.kind, label: BUILT_IN_CALL_TASKS[task.kind].label, completed: false };
    });
  }

  function measurementEntries(record) {
    var values = normalizeMeasurements(record && record.measurements);
    var labels = { waist: "腰围", thigh: "大腿围", calf: "小腿围", bust: "胸围" };
    var entries = Object.keys(labels).filter(function (key) { return values[key] !== null; }).map(function (key) {
      return { label: labels[key], value: values[key] };
    });
    if (values.otherName && values.otherValue !== null) entries.push({ label: values.otherName, value: values.otherValue });
    return entries;
  }

  function measurementsMet(record) {
    return measurementEntries(record).length > 0;
  }

  function workoutEntries(record) {
    return record && Array.isArray(record.workoutEntries) ? record.workoutEntries : [];
  }

  function normalizeWorkoutGoalTemplates(goals) {
    return (Array.isArray(goals) ? goals : []).map(function (goal, index) {
      return {
        id: String(goal.id || "goal-template-" + index),
        type: String(goal.type || goal.custom || "").trim(),
        minutes: Math.max(5, Math.min(300, Math.round(Number(goal.minutes || 0))))
      };
    }).filter(function (goal) { return goal.type && goal.minutes >= 5; }).slice(0, 8);
  }

  function workoutGoals(record) {
    return record && Array.isArray(record.workoutGoals) ? record.workoutGoals : [];
  }

  function workoutTargetMinutes(record) {
    return workoutGoals(record).reduce(function (total, goal) { return total + Number(goal.minutes || 0); }, 0);
  }

  function workoutTotalMinutes(record) {
    var goals = workoutGoals(record);
    if (goals.length) return goals.reduce(function (total, goal) {
      return total + Math.max(0, Number(goal.completedMinutes || 0));
    }, 0);
    return workoutEntries(record).reduce(function (total, entry) { return total + Math.max(0, Number(entry.minutes || 0)); }, 0);
  }

  function workoutCompletedGoalCount(record) {
    return workoutGoals(record).filter(function (goal) { return Number(goal.completedMinutes || 0) >= Number(goal.minutes || 0); }).length;
  }

  function syncWorkoutCompatibility(record, rebuildEntries) {
    if (!record) return;
    var goals = workoutGoals(record);
    var targetMinutes = workoutTargetMinutes(record);
    var completedMinutes = workoutTotalMinutes(record);
    record.workoutPlan = {
      type: goals.map(function (goal) { return goal.type; }).join(" + "),
      custom: "",
      minutes: targetMinutes
    };
    record.workoutActual = {
      type: goals.filter(function (goal) { return Number(goal.completedMinutes || 0) > 0; }).map(function (goal) { return goal.type; }).join(" + "),
      custom: "",
      minutes: completedMinutes
    };
    if (rebuildEntries) record.workoutEntries = goals.filter(function (goal) {
      return Number(goal.completedMinutes || 0) > 0;
    }).map(function (goal) {
      return { id: goal.id, type: goal.type, minutes: Number(goal.completedMinutes || 0) };
    });
  }

  function normalizeDailyRecord(record) {
    if (!record || typeof record !== "object") return record;
    var emptyMeals = createEmptyMeals();
    record.meals = record.meals && typeof record.meals === "object" ? record.meals : {};
    MEAL_KEYS.forEach(function (key) {
      record.meals[key] = Object.assign(emptyMeals[key], record.meals[key] || {});
      var rawCalories = record.meals[key].calories;
      var calories = rawCalories === null || rawCalories === "" || typeof rawCalories === "undefined" ? NaN : Number(rawCalories);
      record.meals[key].calories = Number.isFinite(calories) && calories >= 0 ? Math.round(calories) : null;
    });
    record.workoutPlan = Object.assign({ type: "快走", custom: "", minutes: 20 }, record.workoutPlan || {});
    if (!Array.isArray(record.workoutEntries)) {
      var legacy = record.workoutActual || {};
      var legacyType = workoutName(legacy);
      var legacyMinutes = Number(legacy.minutes || 0);
      record.workoutEntries = legacyType && legacyMinutes > 0 ? [{ id: record.date + "-legacy", type: legacyType, minutes: legacyMinutes }] : [];
    }
    record.workoutEntries = record.workoutEntries.map(function (entry, index) {
      return {
        id: String(entry.id || record.date + "-workout-" + index),
        type: String(entry.type || entry.custom || "").trim(),
        minutes: Math.max(0, Math.min(600, Number(entry.minutes || 0)))
      };
    }).filter(function (entry) { return entry.type && entry.minutes > 0; });
    if (!Array.isArray(record.workoutGoals) || !record.workoutGoals.length) {
      record.workoutGoals = [{
        id: record.date + "-legacy-goal",
        type: workoutName(record.workoutPlan) || "快走",
        minutes: Math.max(5, Number(record.workoutPlan.minutes || 20)),
        completedMinutes: workoutEntries(record).reduce(function (total, entry) { return total + Number(entry.minutes || 0); }, 0)
      }];
    }
    record.workoutGoals = record.workoutGoals.map(function (goal, index) {
      return {
        id: String(goal.id || record.date + "-goal-" + index),
        type: String(goal.type || goal.custom || "").trim(),
        minutes: Math.max(5, Math.min(300, Math.round(Number(goal.minutes || 0)))),
        completedMinutes: Math.max(0, Math.min(600, Math.round(Number(goal.completedMinutes || 0))))
      };
    }).filter(function (goal) { return goal.type && goal.minutes >= 5; }).slice(0, 8);
    if (!record.workoutGoals.length) record.workoutGoals = [{ id: record.date + "-default-goal", type: "快走", minutes: 20, completedMinutes: 0 }];
    record.waterMl = Math.max(0, Math.min(8000, Math.round(Number(record.waterMl || 0))));
    record.waterGoalMl = normalizeWaterGoal(record.waterGoalMl);
    record.measurements = normalizeMeasurements(record.measurements);
    record.callSheet = normalizeCallSheetForRecord(record.callSheet, record.date || todayValue());
    syncWorkoutCompatibility(record, false);
    return record;
  }

  function lightweightRecord(record) {
    var copy = clone(record);
    MEAL_KEYS.forEach(function (key) {
      if (copy.meals && copy.meals[key]) copy.meals[key].photo = "";
    });
    copy.businessPhoto = "";
    return copy;
  }

  function loadBackups() {
    try {
      var parsed = JSON.parse(window.localStorage.getItem(BACKUP_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (error) {
      return {};
    }
  }

  function saveBackup(record) {
    try {
      var backups = loadBackups();
      backups[record.date] = lightweightRecord(record);
      Object.keys(backups).sort().reverse().slice(7).forEach(function (date) { delete backups[date]; });
      window.localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
    } catch (error) {
      return false;
    }
    return true;
  }

  function pruneBackups() {
    try {
      var backups = loadBackups();
      var dates = Object.keys(backups).sort().reverse();
      dates.slice(7).forEach(function (date) { delete backups[date]; });
      window.localStorage.setItem(BACKUP_KEY, JSON.stringify(backups));
    } catch (error) {
      return false;
    }
    return true;
  }

  function updateHistoryCache(record) {
    dailyHistory = dailyHistory.filter(function (item) { return item.date !== record.date; });
    dailyHistory.push(clone(record));
    dailyHistory.sort(function (a, b) { return b.date.localeCompare(a.date); });
    dailyHistory = dailyHistory.slice(0, 60);
  }

  async function saveRecord(record) {
    normalizeDailyRecord(record);
    record.updatedAt = Date.now();
    updateHistoryCache(record);
    saveBackup(record);
    saveSettings();
    if (window.EveDailyStore) {
      try {
        if (!storageAvailable) {
          await window.EveDailyStore.open();
          storageAvailable = true;
        }
        await window.EveDailyStore.putDay(clone(record));
      } catch (error) {
        storageAvailable = false;
      }
    }
  }

  function oldestRetainedDate() {
    return addDays(todayValue(), -59);
  }

  function latestPreviousRecord(date) {
    return dailyHistory.filter(function (record) {
      return record.date < date && record.weightSubmitted;
    }).sort(function (a, b) {
      return b.date.localeCompare(a.date);
    })[0] || null;
  }

  function createWorkoutGoalsForDay(date) {
    var templates = normalizeWorkoutGoalTemplates(state.plan.lastWorkoutGoals);
    if (!templates.length) templates = [{ id: "default-walk", type: "快走", minutes: 20 }];
    return templates.map(function (goal, index) {
      return { id: date + "-goal-" + index + "-" + hashString(goal.type + goal.minutes), type: goal.type, minutes: goal.minutes, completedMinutes: 0 };
    });
  }

  function createBaselineRecord() {
    var weight = Number(state.profile.startWeight);
    var record = {
      date: state.profile.startDate || todayValue(),
      planId: state.plan.id,
      weight: weight,
      weightSubmitted: true,
      previousWeight: weight,
      plannedWeight: weight,
      weightStatus: "baseline",
      morningFans: 0,
      longTermPenalty: 0,
      morningSettled: true,
      rewardProgressBefore: 0,
      rewardProgressAfter: 0,
      streakBefore: 0,
      streakAfter: 0,
      behindStreakBefore: 0,
      behindStreakAfter: 0,
      meals: createEmptyMeals(),
      workoutPlan: clone(state.plan.lastWorkoutPlan),
      workoutActual: { type: "", custom: "", minutes: 0 },
      workoutEntries: [],
      workoutGoals: createWorkoutGoalsForDay(state.profile.startDate || todayValue()),
      waterMl: 0,
      waterGoalMl: normalizeWaterGoal(state.plan.lastWaterGoalMl),
      measurements: normalizeMeasurements(),
      callSheet: createCallSheetForDay(state.profile.startDate || todayValue()),
      businessPhoto: "",
      photoFans: 0,
      eveningFans: null,
      eveningSettled: false,
      sealed: false,
      fanTotalAfter: state.fans,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return normalizeDailyRecord(record);
  }

  function createDailyRecord(date, previous) {
    var previousWeight = previous ? Number(previous.weight) : Number(state.profile.startWeight);
    var remainingDays = Math.max(1, daysBetween(date, state.profile.debutDate));
    var target = Number(state.profile.targetWeight);
    var plannedWeight = state.profile.mode === "maintenance"
      ? Number(state.profile.maintenanceCenter)
      : previousWeight - Math.max(0, previousWeight - target) / remainingDays;
    var record = {
      date: date,
      planId: state.plan.id,
      weight: previousWeight,
      weightSubmitted: false,
      previousWeight: previousWeight,
      plannedWeight: roundPlanWeight(plannedWeight),
      weightStatus: "pending",
      morningFans: null,
      longTermPenalty: 0,
      morningSettled: false,
      rewardProgressBefore: state.rewardProgress,
      rewardProgressAfter: state.rewardProgress,
      streakBefore: state.streak,
      streakAfter: state.streak,
      behindStreakBefore: state.behindStreak,
      behindStreakAfter: state.behindStreak,
      meals: createEmptyMeals(),
      workoutPlan: clone(state.plan.lastWorkoutPlan),
      workoutActual: { type: "", custom: "", minutes: 0 },
      workoutEntries: [],
      workoutGoals: createWorkoutGoalsForDay(date),
      waterMl: 0,
      waterGoalMl: normalizeWaterGoal(state.plan.lastWaterGoalMl),
      measurements: normalizeMeasurements(),
      callSheet: createCallSheetForDay(date),
      businessPhoto: "",
      photoFans: 0,
      eveningFans: null,
      eveningSettled: false,
      sealed: false,
      fanTotalAfter: state.fans,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    return normalizeDailyRecord(record);
  }

  function mealCount(record) {
    return MEAL_KEYS.filter(function (key) {
      return record && record.meals && record.meals[key] && record.meals[key].logged;
    }).length;
  }

  function workoutName(workout) {
    if (!workout) return "";
    return String(workout.type === "其他" ? workout.custom || "" : workout.type || "").trim();
  }

  function workoutMet(record) {
    var goals = workoutGoals(record);
    return Boolean(goals.length) && goals.every(function (goal) { return Number(goal.completedMinutes || 0) >= Number(goal.minutes || 0); });
  }

  function waterMet(record) {
    return Boolean(record) && Number(record.waterMl || 0) >= normalizeWaterGoal(record.waterGoalMl);
  }

  function callSheetTasks(record) {
    return record && Array.isArray(record.callSheet) ? record.callSheet : [];
  }

  function callTask(record, kind) {
    return callSheetTasks(record).find(function (task) { return task.kind === kind; }) || null;
  }

  function callTaskComplete(record, task) {
    if (!record || !task) return false;
    if (task.kind === "meals") return mealCount(record) === MEAL_KEYS.length;
    if (task.kind === "workout") return workoutMet(record);
    if (task.kind === "water") return waterMet(record);
    if (task.kind === "measurements") return measurementsMet(record);
    return task.kind === "custom" && Boolean(task.completed);
  }

  function taskDoneCount(record) {
    return callSheetTasks(record).filter(function (task) { return callTaskComplete(record, task); }).length;
  }

  function taskTotalCount(record) {
    return callSheetTasks(record).length;
  }

  function allCallTasksComplete(record) {
    return taskTotalCount(record) >= MIN_DAILY_TASKS && taskDoneCount(record) === taskTotalCount(record);
  }

  function roundPlanWeight(value) {
    return Number(Number(value).toFixed(PLAN_WEIGHT_DECIMALS));
  }

  function plannedWeightValue(record) {
    return roundPlanWeight(record && record.plannedWeight);
  }

  function formatWeightDifference(value) {
    var difference = Math.abs(Number(value));
    return difference < 0.1 ? difference.toFixed(2) : difference.toFixed(1);
  }

  function baseTasksComplete(record) {
    return taskTotalCount(record) >= MIN_DAILY_TASKS && taskDoneCount(record) >= MIN_DAILY_TASKS;
  }

  function managerMessageId(date, type) {
    return date + "-" + type;
  }

  function upsertManagerMessage(message) {
    state.managerMessages = state.managerMessages.filter(function (item) { return item.id !== message.id; });
    state.managerMessages.unshift(message);
    state.managerMessages = state.managerMessages.slice(0, 60);
  }

  function managerMilestoneKey(date) {
    var elapsed = Math.max(0, daysBetween(state.profile.startDate || date, date));
    if (state.profile.debutDate && daysBetween(date, state.profile.debutDate) <= 0) return "day30";
    if (elapsed >= 21) return "day21";
    if (elapsed >= 14) return "day14";
    if (elapsed >= 7) return "day7";
    if (elapsed >= 3) return "day3";
    return "newcomer";
  }

  function managerStatusKey(record) {
    var status = record && record.weightStatus;
    if (status === "achieved" || status === "maintenance") return "achieved";
    if (status === "progress") return "progress";
    if (status === "behind") return "behind";
    return "baseline";
  }

  function managerScenarioMessage(date, record) {
    var milestone = managerMilestoneKey(date || todayValue());
    var status = managerStatusKey(record);
    var pool = MANAGER_MESSAGE_LIBRARY[milestone][status];
    var index = seededRange(date, "manager-" + milestone + "-" + status, 0, pool.length - 1);
    var latest = state.managerMessages.find(function (message) { return message.side === "manager"; });
    if (latest && pool.length > 1 && pool[index] === latest.text) index = (index + 1) % pool.length;
    return pool[index];
  }

  function managerMessageLibrarySize() {
    return Object.keys(MANAGER_MESSAGE_LIBRARY).reduce(function (total, milestone) {
      return total + Object.keys(MANAGER_MESSAGE_LIBRARY[milestone]).reduce(function (subtotal, status) {
        return subtotal + MANAGER_MESSAGE_LIBRARY[milestone][status].length;
      }, 0);
    }, 0);
  }

  function presetCopyAudit() {
    var copies = [];
    var fanCopies = [];
    Object.keys(FAN_COMMENTS).forEach(function (stage) { fanCopies = fanCopies.concat(FAN_COMMENTS[stage]); });
    Object.keys(FAN_CONTEXT_COMMENTS).forEach(function (context) { fanCopies = fanCopies.concat(FAN_CONTEXT_COMMENTS[context]); });
    copies = copies.concat(fanCopies);
    Object.keys(MANAGER_MESSAGE_LIBRARY).forEach(function (milestone) {
      Object.keys(MANAGER_MESSAGE_LIBRARY[milestone]).forEach(function (status) {
        copies = copies.concat(MANAGER_MESSAGE_LIBRARY[milestone][status]);
      });
    });
    return {
      total: copies.length,
      unique: new Set(copies).size,
      fanTotal: fanCopies.length,
      sisterTotal: fanCopies.filter(function (copy) { return copy.includes("姐姐"); }).length,
      fanNameTotal: FAN_NAMES.length,
      uniqueFanNames: new Set(FAN_NAMES).size
    };
  }

  function latestManagerText() {
    var message = state.managerMessages.find(function (item) { return item.side === "manager"; });
    return message ? message.text : managerScenarioMessage(todayValue(), todayRecord);
  }

  function ensureDailyManagerMessage() {
    var date = todayValue();
    var id = managerMessageId(date, "daily");
    if (!state.onboardingComplete || state.plan.status !== "active" || state.outcome) return;
    if (state.profile.startDate && date < state.profile.startDate) return;
    if (state.managerMessages.some(function (message) { return message.id === id; })) return;
    var context = latestPreviousRecord(date) || todayRecord || { weightStatus: "baseline" };
    upsertManagerMessage({
      id: id,
      date: date,
      side: "manager",
      time: "06:00 · 每日提醒",
      text: managerScenarioMessage(date, context)
    });
    saveSettings();
  }

  function settleEvening(record, automatic) {
    if (!record || record.eveningSettled) return Number(record && record.eveningFans || 0);
    var delta = 0;
    var mealRange = fanStageRange("mealGain");
    var workoutRange = fanStageRange("workoutGain");
    var waterRange = fanStageRange("waterGain");
    var photoRange = fanStageRange("photoGain");
    if (callTask(record, "meals")) MEAL_KEYS.forEach(function (key) {
      if (record.meals[key].logged) delta += seededRange(record.date, "evening-meal-" + key, mealRange[0], mealRange[1]);
    });
    if (callTask(record, "workout") && workoutMet(record)) delta += seededRange(record.date, "evening-workout", workoutRange[0], workoutRange[1]);
    if (callTask(record, "water") && waterMet(record)) delta += seededRange(record.date, "evening-water", waterRange[0], waterRange[1]);
    callSheetTasks(record).filter(function (task) {
      return (task.kind === "measurements" || task.kind === "custom") && callTaskComplete(record, task);
    }).forEach(function (task, index) {
      delta += seededRange(record.date, "evening-flex-" + task.kind + "-" + index, Math.max(20, Math.round(waterRange[0] / 3)), Math.max(50, Math.round(waterRange[1] / 3)));
    });
    if (record.businessPhoto) {
      record.photoFans = seededRange(record.date, "business-photo", photoRange[0], photoRange[1]);
      delta += record.photoFans;
    }
    record.eveningFans = delta;
    record.eveningSettled = true;
    record.sealed = true;
    state.fans = Math.max(0, state.fans + delta);
    record.fanTotalAfter = state.fans;
    upsertManagerMessage({
      id: managerMessageId(record.date, "evening"),
      date: record.date,
      side: "manager",
      time: automatic ? "次日补结" : "晚间结算",
      text: allCallTasksComplete(record)
        ? "今天的 " + taskTotalCount(record) + " 项通告都交齐了。收工，去好好休息，明天六点后再来报到。"
        : "今天交了 " + taskDoneCount(record) + "/" + taskTotalCount(record) + " 项。" + (baseTasksComplete(record) ? "已经达到今日要求，剩下的不用熬夜补。" : "没完成的如实记下，别熬夜补，明天重新来。")
    });
    if (automatic) {
      state.pendingCarryover = {
        date: record.date,
        text: "昨天的训练我已经补结算，粉丝变化 " + signedNumber(delta) + "。今天重新开始。"
      };
    }
    return delta;
  }

  async function prepareDailyStorage() {
    var backups = loadBackups();
    pruneBackups();
    backups = loadBackups();
    try {
      await window.EveDailyStore.open();
      storageAvailable = true;
      await window.EveDailyStore.pruneBefore(oldestRetainedDate());
      dailyHistory = await window.EveDailyStore.getAllDays();
      var archivedDates = dailyHistory.reduce(function (result, record) {
        result[record.date] = true;
        return result;
      }, {});
      var recoverableDates = Object.keys(backups).filter(function (date) {
        return date >= oldestRetainedDate() && !archivedDates[date];
      });
      if (recoverableDates.length) {
        await Promise.all(recoverableDates.map(function (date) {
          return window.EveDailyStore.putDay(clone(backups[date]));
        }));
        dailyHistory = await window.EveDailyStore.getAllDays();
      }
    } catch (error) {
      storageAvailable = false;
      dailyHistory = Object.keys(backups).map(function (date) { return backups[date]; }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    }

    dailyHistory = dailyHistory.map(normalizeDailyRecord).filter(Boolean);

    if (!state.onboardingComplete) return;

    var currentDate = todayValue();
    var existing = dailyHistory.find(function (record) { return record.date === currentDate; });
    if (!existing && state.plan.status === "active" && !state.outcome) {
      var previous = latestPreviousRecord(currentDate);
      if (previous && !previous.sealed) {
        settleEvening(previous, true);
        await saveRecord(previous);
      }
      existing = createDailyRecord(currentDate, previous);
      await saveRecord(existing);
    }
    todayRecord = existing || null;
    if (repairCurrentDayPlanPrecision(todayRecord)) await saveRecord(todayRecord);
    saveSettings();
  }

  function repairCurrentDayPlanPrecision(record) {
    if (!record || record.weightStatus === "baseline") return false;
    var storedPlannedWeight = Number(record.plannedWeight);
    var remainingDays = Math.max(1, daysBetween(record.date, state.profile.debutDate));
    var previousWeight = Number(record.previousWeight);
    record.plannedWeight = state.profile.mode === "maintenance"
      ? roundPlanWeight(state.profile.maintenanceCenter)
      : roundPlanWeight(previousWeight - Math.max(0, previousWeight - Number(state.profile.targetWeight)) / remainingDays);
    var planPrecisionChanged = Math.abs(storedPlannedWeight - record.plannedWeight) > 0.001;
    if (!record.weightSubmitted || !record.morningSettled || typeof record.fansBeforeMorning !== "number") return planPrecisionChanged;
    var correctedStatus = classifyWeight(record, Number(record.weight));
    if (correctedStatus === record.weightStatus) return planPrecisionChanged;
    var eveningFans = record.eveningSettled ? Number(record.eveningFans || 0) : 0;
    applyMorningSettlement(record, Number(record.weight));
    if (record.eveningSettled) {
      state.fans = Math.max(0, state.fans + eveningFans);
      record.fanTotalAfter = state.fans;
    }
    return true;
  }

  function showToast(message) {
    var toast = document.getElementById("toast");
    setText("toastText", message);
    window.clearTimeout(toastTimer);
    if (window.EveMotion) window.EveMotion.toast(toast);
    else toast.classList.add("is-visible");
    toastTimer = window.setTimeout(function () { toast.classList.remove("is-visible"); }, 1900);
  }

  function refreshIcons() {
    if (window.lucide) window.lucide.createIcons({ attrs: { "stroke-width": 2 } });
  }

  function revealElement(element) {
    if (!element) return;
    element.hidden = false;
    if (window.EveMotion) window.EveMotion.reveal(element);
  }

  function scrollThreadToBottom() {
    var thread = document.getElementById("onboardingThread");
    if (thread) window.setTimeout(function () { thread.scrollTo({ top: thread.scrollHeight, behavior: "smooth" }); }, 60);
  }

  function openSheet(id) {
    var sheet = document.getElementById(id);
    if (!sheet) return;
    sheet._motionSequence = Number(sheet._motionSequence || 0) + 1;
    sheet.hidden = false;
    var panel = sheet.querySelector(".bottom-sheet");
    if (panel) panel.scrollTop = 0;
    document.body.classList.add("has-sheet");
    if (window.EveMotion) window.EveMotion.openSheet(sheet);
  }

  function closeSheet(id) {
    var sheet = document.getElementById(id);
    if (!sheet || sheet.hidden) return;
    var sequence = Number(sheet._motionSequence || 0) + 1;
    sheet._motionSequence = sequence;
    var finish = function () {
      if (sheet._motionSequence !== sequence) return;
      sheet.hidden = true;
      if (!document.querySelector(".sheet-overlay:not([hidden]), .confirm-overlay:not([hidden])")) document.body.classList.remove("has-sheet");
    };
    if (window.EveMotion) window.EveMotion.closeSheet(sheet, finish);
    else finish();
    window.setTimeout(function () {
      if (!sheet.hidden) finish();
    }, 420);
  }

  function askConfirmation(title, copy, actionLabel, handler) {
    setText("confirmTitle", title);
    setText("confirmCopy", copy);
    setText("confirmActionButton", actionLabel || "确认");
    confirmHandler = handler;
    var overlay = document.getElementById("confirmOverlay");
    overlay._motionSequence = Number(overlay._motionSequence || 0) + 1;
    overlay.hidden = false;
    if (window.EveMotion) window.EveMotion.openConfirm(overlay);
  }

  function closeConfirmation() {
    var overlay = document.getElementById("confirmOverlay");
    var sequence = Number(overlay._motionSequence || 0) + 1;
    overlay._motionSequence = sequence;
    confirmHandler = null;
    var finish = function () {
      if (overlay._motionSequence === sequence) overlay.hidden = true;
    };
    if (window.EveMotion) window.EveMotion.closeConfirm(overlay, finish);
    else finish();
    window.setTimeout(finish, 420);
  }

  function imageFileToDataUrl(file, maximumWidth, maximumHeight, quality) {
    return new Promise(function (resolve, reject) {
      if (!file || !String(file.type || "").startsWith("image/")) {
        reject(new Error("image-required"));
        return;
      }
      var reader = new FileReader();
      reader.onload = function () {
        var image = new Image();
        image.onload = function () {
          var scale = Math.min(1, maximumWidth / image.width, maximumHeight / image.height);
          var width = Math.max(1, Math.round(image.width * scale));
          var height = Math.max(1, Math.round(image.height * scale));
          var canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          var context = canvas.getContext("2d");
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, width, height);
          context.drawImage(image, 0, 0, width, height);
          resolve(canvas.toDataURL("image/jpeg", quality));
        };
        image.onerror = function () { reject(new Error("image-load-failed")); };
        image.src = reader.result;
      };
      reader.onerror = function () { reject(new Error("file-read-failed")); };
      reader.readAsDataURL(file);
    });
  }

  function collectFoodInputs(prefix) {
    return [1, 2, 3].map(function (index) {
      var input = document.getElementById(prefix + index);
      return input ? input.value.trim() : "";
    }).filter(Boolean).slice(0, 3);
  }

  function parseLocalizedNumber(value) {
    var normalized = String(value || "")
      .replace(/[０-９]/g, function (digit) { return String(digit.charCodeAt(0) - 65296); })
      .replace(/[．。]/g, ".")
      .replace(/[，,]/g, ".")
      .replace(/\s/g, "")
      .replace(/(厘米|公分|千克|公斤|cm|kg)/gi, "");
    if (!/^(?:\d+\.?\d*|\.\d+)$/.test(normalized)) return NaN;
    return Number(normalized);
  }

  function clearProfileSetupErrors() {
    setHidden("profileSetupError", true);
    ["onboardingNameInput", "onboardingHeightInput", "onboardingWeightInput", "onboardingFoodInput1", "onboardingFoodInput2", "onboardingFoodInput3"].forEach(function (id) {
      document.getElementById(id).removeAttribute("aria-invalid");
    });
  }

  function showProfileSetupError(message, inputId) {
    setText("profileSetupError", message);
    setHidden("profileSetupError", false);
    var input = document.getElementById(inputId);
    if (!input) return;
    input.setAttribute("aria-invalid", "true");
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function getWeightSafetyNotice(height, currentWeight, targetWeight) {
    var heightMeters = Number(height) / 100;
    var currentBmi = Number(currentWeight) / (heightMeters * heightMeters);
    var targetBmi = Number(targetWeight) / (heightMeters * heightMeters);
    if (!heightMeters || !Number.isFinite(currentBmi) || !Number.isFinite(targetBmi) || targetBmi >= 18.5) return null;
    if (targetBmi < 16) {
      return {
        blocked: true,
        title: "这个目标我不能批准",
        detail: "这个目标体重过低。训练可以继续，但请把目标调高一点，身体状态比数字更重要。",
        bmi: targetBmi
      };
    }
    return {
      blocked: false,
      title: currentBmi < 18.5 ? "你现在已经很轻了" : "这个目标已经很轻了",
      detail: "可以继续参加训练，但我更建议保持现在的体重，不要为了数字过度追求更低体重。",
      bmi: targetBmi
    };
  }

  function evaluateTarget(height, currentWeight, targetWeight, debutDate) {
    var heightMeters = Number(height) / 100;
    var current = Number(currentWeight);
    var target = Number(targetWeight);
    var days = Math.max(1, daysBetween(todayValue(), debutDate));
    if (!heightMeters || !current || !target || target >= current || !parseDate(debutDate)) {
      return { valid: false, blocked: true, title: "目标无效", detail: "目标体重需要低于当前体重，并选择未来日期。" };
    }
    var targetBmi = target / (heightMeters * heightMeters);
    var weekly = (current - target) / days * 7;
    var safetyNotice = getWeightSafetyNotice(height, current, target);
    if (safetyNotice) {
      return {
        valid: !safetyNotice.blocked,
        blocked: safetyNotice.blocked,
        mode: "loss",
        warning: true,
        lowBmi: !safetyNotice.blocked,
        title: safetyNotice.title,
        detail: safetyNotice.detail,
        bmi: safetyNotice.bmi,
        weekly: weekly
      };
    }
    if (weekly > 1) {
      return { valid: true, blocked: false, mode: "loss", warning: true, title: "时间比较紧", detail: "平均每周需要 " + weekly.toFixed(2) + "kg，仍可继续，但建议延后出道日。", bmi: targetBmi, weekly: weekly };
    }
    if (weekly > 0.5) {
      return { valid: true, blocked: false, mode: "loss", warning: true, title: "高强度计划", detail: "平均每周需要 " + weekly.toFixed(2) + "kg，请留意身体状态。", bmi: targetBmi, weekly: weekly };
    }
    return { valid: true, blocked: false, mode: "loss", title: "节奏稳定", detail: "平均每周需要 " + weekly.toFixed(2) + "kg。", bmi: targetBmi, weekly: weekly };
  }

  function renderPaceCheck(targetId, evaluation) {
    var element = document.getElementById(targetId);
    if (!element) return;
    element.classList.toggle("is-warning", Boolean(evaluation && evaluation.warning));
    element.classList.toggle("is-blocked", Boolean(evaluation && evaluation.blocked));
    var strong = element.querySelector("strong");
    var span = element.querySelector("span");
    strong.textContent = evaluation ? evaluation.title : "等待目标";
    span.textContent = evaluation ? evaluation.detail : "填写后会检查所需节奏";
  }

  function startOnboarding() {
    document.getElementById("bootScreen").hidden = true;
    document.getElementById("mainApp").hidden = true;
    document.getElementById("dailyCheckin").hidden = true;
    document.getElementById("outcomeScreen").hidden = true;
    document.getElementById("onboardingShell").hidden = false;
    var defaultDate = addDays(todayValue(), 30);
    document.getElementById("debutDateInput").min = addDays(todayValue(), 1);
    document.getElementById("debutDateInput").value = defaultDate;
    setText("defaultDebutDateLabel", formatShortDate(defaultDate));
    setText("targetPlanTitle", "D-30");
    document.getElementById("rookieTransitionMessage").hidden = true;
    document.getElementById("profilePromptMessage").hidden = true;
    document.getElementById("introContinueButton").hidden = true;
    refreshIcons();
    if (window.EveMotion) window.EveMotion.onboardingIntro();
    playOnboardingIntroSequence();
  }

  async function playOnboardingIntroSequence() {
    await new Promise(function (resolve) { window.setTimeout(resolve, 1400); });
    revealElement(document.getElementById("rookieTransitionMessage"));
    scrollThreadToBottom();
    await new Promise(function (resolve) { window.setTimeout(resolve, 1600); });
    revealElement(document.getElementById("profilePromptMessage"));
    scrollThreadToBottom();
    await new Promise(function (resolve) { window.setTimeout(resolve, 1200); });
    revealElement(document.getElementById("introContinueButton"));
    scrollThreadToBottom();
  }

  async function showProfileSetup() {
    document.getElementById("introContinueButton").hidden = true;
    await new Promise(function (resolve) { window.setTimeout(resolve, 180); });
    revealElement(document.getElementById("profileSetupCard"));
    scrollThreadToBottom();
  }

  async function submitProfileSetup() {
    var name = document.getElementById("onboardingNameInput").value.trim();
    var height = parseLocalizedNumber(document.getElementById("onboardingHeightInput").value);
    var weight = parseLocalizedNumber(document.getElementById("onboardingWeightInput").value);
    var foods = collectFoodInputs("onboardingFoodInput");
    clearProfileSetupErrors();
    if (!name) return showProfileSetupError("请先填写艺名。", "onboardingNameInput");
    if (!Number.isFinite(height)) return showProfileSetupError("身高格式没有识别，请填写 165 或 1.65。", "onboardingHeightInput");
    if (height > 1.2 && height <= 2.2) height *= 100;
    if (height < 120 || height > 220) return showProfileSetupError("身高请填写 120～220cm；也可以填写 1.65m。", "onboardingHeightInput");
    if (!Number.isFinite(weight)) return showProfileSetupError("体重格式没有识别，请按 kg 填写数字。", "onboardingWeightInput");
    if (weight < 30 || weight > 250) return showProfileSetupError("当前体重需在 30～250kg 之间，请检查填写内容。", "onboardingWeightInput");
    if (!foods.length) return showProfileSetupError("请至少填写一种喜欢的食物，用来制作奖励券。", "onboardingFoodInput1");
    height = Math.round(height * 10) / 10;
    weight = Math.round(weight * 10) / 10;
    onboardingDraft = { name: name, height: height, weight: weight, favoriteFoods: foods, avatar: pendingAvatar };
    document.getElementById("profileSetupCard").hidden = true;
    setText("profileSummaryText", "艺名 " + name + "，" + height + "cm，当前 " + weight.toFixed(1) + "kg。喜欢 " + foods.join("、") + "。");
    revealElement(document.getElementById("profileSummaryMessage"));
    scrollThreadToBottom();
    await new Promise(function (resolve) { window.setTimeout(resolve, 360); });
    revealElement(document.getElementById("managerPauseMessage"));
    scrollThreadToBottom();
    await new Promise(function (resolve) { window.setTimeout(resolve, 520); });
    revealElement(document.getElementById("managerStrictMessage"));
    scrollThreadToBottom();
    await new Promise(function (resolve) { window.setTimeout(resolve, 520); });
    revealElement(document.getElementById("targetPlanCard"));
    scrollThreadToBottom();
  }

  function backToIntro() {
    document.getElementById("profileSetupCard").hidden = true;
    revealElement(document.getElementById("introContinueButton"));
    scrollThreadToBottom();
  }

  function backToProfileSetup() {
    ["profileSummaryMessage", "managerPauseMessage", "managerStrictMessage", "targetPlanCard"].forEach(function (id) {
      document.getElementById(id).hidden = true;
    });
    revealElement(document.getElementById("profileSetupCard"));
    scrollThreadToBottom();
  }

  function updateOnboardingTargetPreview() {
    if (!onboardingDraft) return;
    var date = document.getElementById("debutDateInput").value;
    var target = Number(document.getElementById("targetWeightInput").value);
    var remaining = Math.max(0, daysBetween(todayValue(), date));
    setText("targetPlanTitle", "D-" + remaining);
    var evaluation = target ? evaluateTarget(onboardingDraft.height, onboardingDraft.weight, target, date) : null;
    renderPaceCheck("paceCheck", evaluation);
  }

  async function confirmOnboardingTarget() {
    if (!onboardingDraft) return;
    var date = document.getElementById("debutDateInput").value;
    var target = Number(document.getElementById("targetWeightInput").value);
    var evaluation = evaluateTarget(onboardingDraft.height, onboardingDraft.weight, target, date);
    renderPaceCheck("paceCheck", evaluation);
    if (!evaluation.valid || evaluation.blocked) {
      setText("targetPlanError", evaluation.detail);
      setHidden("targetPlanError", false);
      showToast(evaluation.title);
      return;
    }
    setHidden("targetPlanError", true);
    state = createDefaultState();
    state.onboardingComplete = true;
    state.trainingStarted = false;
    state.activeView = "profile";
    state.profile = {
      name: onboardingDraft.name,
      height: onboardingDraft.height,
      favoriteFoods: onboardingDraft.favoriteFoods,
      avatar: onboardingDraft.avatar,
      startWeight: onboardingDraft.weight,
      targetWeight: evaluation.mode === "maintenance" ? onboardingDraft.weight : target,
      maintenanceCenter: evaluation.mode === "maintenance" ? onboardingDraft.weight : null,
      mode: evaluation.mode,
      startDate: todayValue(),
      debutDate: date
    };
    state.plan = {
      id: "plan-" + Date.now(),
      status: "active",
      targetEditUsed: false,
      dateEditUsed: false,
      lastWorkoutPlan: { type: "快走", custom: "", minutes: 20 },
      lastWorkoutGoals: [{ id: "default-walk", type: "快走", minutes: 20 }],
      lastCallSheetTemplate: defaultCallSheetTemplate(),
      lastWaterGoalMl: DEFAULT_WATER_GOAL_ML,
      lastActualWorkoutType: "",
      extensionCount: 0
    };
    state.managerMessages = [{
      id: managerMessageId(todayValue(), "daily"),
      date: todayValue(),
      side: "manager",
      time: "06:00 · 新人报到",
      text: managerScenarioMessage(todayValue(), { weightStatus: evaluation.mode === "maintenance" ? "maintenance" : "baseline" })
    }];
    saveSettings();
    todayRecord = createBaselineRecord();
    await saveRecord(todayRecord);
    document.getElementById("targetPlanCard").hidden = true;
    setText("onboardingFinalText", evaluation.mode === "maintenance" ? "计划成立。你会进入体重维持模式，先看新人档案。" : "计划成立。目标 " + target.toFixed(1) + "kg，先看一眼你的新人档案。");
    revealElement(document.getElementById("onboardingFinalMessage"));
    revealElement(document.getElementById("openProfileButton"));
    scrollThreadToBottom();
  }

  function applyAvatarToElements() {
    var avatar = state.profile.avatar || "";
    var defaultAvatar = "assets/rookie-default-avatar.svg";
    var profileImage = document.getElementById("profileAvatarImage");
    var profileArt = document.getElementById("profileAvatarArt");
    if (avatar) profileImage.src = avatar;
    else profileImage.removeAttribute("src");
    profileImage.hidden = !avatar;
    profileArt.hidden = Boolean(avatar);
    document.querySelectorAll("[data-user-avatar]").forEach(function (element) {
      element.textContent = "";
      element.style.backgroundImage = "url(\"" + (avatar || defaultAvatar) + "\")";
    });
  }

  function currentWeight() {
    if (todayRecord && todayRecord.weightSubmitted) return Number(todayRecord.weight);
    var previous = latestPreviousRecord(todayValue());
    return previous ? Number(previous.weight) : Number(state.profile.startWeight || 0);
  }

  function progressPercent() {
    if (state.profile.mode === "maintenance") return 100;
    var total = Number(state.profile.startWeight) - Number(state.profile.targetWeight);
    if (total <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((Number(state.profile.startWeight) - currentWeight()) / total * 100)));
  }

  function dynamicDailyPace() {
    if (state.profile.mode === "maintenance") return 0;
    var remaining = Math.max(1, daysUntil(state.profile.debutDate));
    return Math.max(0, currentWeight() - Number(state.profile.targetWeight)) / remaining;
  }

  function totalTodayFans(record) {
    if (!record) return 0;
    return Number(record.morningFans || 0) + Number(record.longTermPenalty || 0) + Number(record.eveningFans || 0);
  }

  function statusClass(status) {
    if (status === "maintenance") return "achieved";
    return status || "pending";
  }

  function statusCopy(record) {
    if (!record || !record.weightSubmitted) return "等待称重";
    if (record.weightStatus === "baseline") return "建档基线";
    if (record.weightStatus === "achieved" || record.weightStatus === "maintenance") return "达到今日计划";
    if (record.weightStatus === "progress") return "比昨天轻，但仍未达标";
    return "今日体重持平或上涨";
  }

  function managerDailyText(record) {
    return managerScenarioMessage(record && record.date || todayValue(), record);
  }

  function renderProfileData() {
    var profile = state.profile;
    var remaining = daysUntil(profile.debutDate);
    var progress = progressPercent();
    var weight = currentWeight();
    var target = Number(profile.targetWeight || 0);
    var pace = dynamicDailyPace();
    document.querySelectorAll("[data-stage-name]").forEach(function (element) { element.textContent = profile.name || "LUMI"; });
    setText("todayDateLabel", formatDateLabel(todayValue()));
    setText("homeCountdown", "D-" + remaining);
    setText("homeDebutDate", formatShortDate(profile.debutDate));
    setText("homeCurrentWeight", weight ? weight.toFixed(1) : "--");
    document.getElementById("editHomeWeightButton").disabled = !todayRecord || (todayRecord.sealed && todayRecord.date !== profile.startDate);
    setText("homeTargetWeight", target ? target.toFixed(1) : "--");
    setText("recordCountdown", "D-" + remaining);
    setText("recordWeightValue", weight ? weight.toFixed(1) : "--");
    setText("profileHeight", profile.height ? profile.height + " CM" : "-- CM");
    setText("profileFavorite", "FAV · " + (profile.favoriteFoods || []).join(" / "));
    setText("profileDebutDate", formatFullDate(profile.debutDate));
    setText("profileGoalWeight", profile.mode === "maintenance" ? "±0.5 KG" : target.toFixed(1) + " KG");
    setText("profileFanCount", formatFans(state.fans));
    setText("profilePlanSummary", profile.mode === "maintenance" ? "维持 " + Number(profile.maintenanceCenter).toFixed(1) + "±0.5kg · 还剩 " + remaining + " 天" : "目标 " + target.toFixed(1) + "kg · 还剩 " + remaining + " 天");
    setText("profileRewardSummary", "进度 " + state.rewardProgress + "/3 · " + state.rewards.length + " 张券");
    setText("profileAlbumSummary", dailyHistory.filter(function (record) { return Boolean(record.businessPhoto); }).length + " 张营业照");
    setText("fanCount", formatFans(state.fans));
    setText("fanCountSecondary", formatFans(state.fans));
    setText("streakCount", state.streak);
    setText("todayFanDelta", "今天 " + signedNumber(totalTodayFans(todayRecord)));
    setText("todayStatusChip", todayRecord && todayRecord.weightSubmitted ? STATUS_LABELS[todayRecord.weightStatus] || "进行中" : "待称重");
    setText("recordWeightStatus", statusCopy(todayRecord));
    setText("dailyWeightTarget", profile.mode === "maintenance" ? "±0.5" : pace.toFixed(2));
    setText("dailyWeightFormula", profile.mode === "maintenance" ? "维持当前体重区间" : Math.max(0, weight - target).toFixed(1) + "kg ÷ " + Math.max(1, remaining) + "天");
    setText("homeProgressLabel", "完成 " + progress + "%");
    setText("homeRemainingLabel", profile.mode === "maintenance" ? "当前为维持计划" : "距离目标 " + Math.max(0, weight - target).toFixed(1) + "kg");
    document.getElementById("homeProgressBar").style.width = progress + "%";
    document.querySelector(".progress-track").setAttribute("aria-valuenow", progress);
    setText("managerText", latestManagerText());
    applyAvatarToElements();
    renderPastPlans();
    renderDataBackupStatus();
  }

  function renderWorkoutEntryList() {
    var list = document.getElementById("workoutEntryList");
    if (!list || !todayRecord) return;
    list.replaceChildren();
    var goals = workoutGoals(todayRecord);
    if (!goals.length) {
      var empty = document.createElement("div");
      empty.className = "workout-entry-empty";
      empty.textContent = "今天还没有运动计划，先点右上角设置目标。";
      list.appendChild(empty);
      return;
    }
    goals.forEach(function (goal) {
      var completed = Number(goal.completedMinutes || 0);
      var isComplete = completed >= Number(goal.minutes || 0);
      var row = document.createElement("div");
      row.className = "workout-entry" + (isComplete ? " is-complete" : completed > 0 ? " is-partial" : "");
      var main = document.createElement("button");
      main.type = "button";
      main.className = "workout-entry__main";
      main.dataset.workoutGoalCheck = goal.id;
      main.disabled = todayRecord.sealed;
      main.setAttribute("aria-label", isComplete ? "撤销" + goal.type + "完成状态" : "标记" + goal.type + "全部完成");
      var icon = document.createElement("span");
      icon.className = "workout-check-icon";
      icon.innerHTML = '<i data-lucide="check"></i>';
      var copy = document.createElement("div");
      copy.className = "workout-entry__copy";
      var title = document.createElement("strong");
      var detail = document.createElement("small");
      title.textContent = goal.type;
      detail.textContent = "目标 " + goal.minutes + " 分钟";
      copy.append(title, detail);
      var status = document.createElement("b");
      status.className = "workout-entry__status";
      status.textContent = isComplete ? "已完成" : completed > 0 ? completed + "/" + goal.minutes + " 分钟" : "待打卡";
      main.append(icon, copy, status);
      var minutes = document.createElement("div");
      minutes.className = "workout-entry__minutes";
      var inputWrap = document.createElement("div");
      inputWrap.className = "input-with-unit";
      var input = document.createElement("input");
      input.type = "number";
      input.min = "0";
      input.max = "600";
      input.step = "1";
      input.inputMode = "numeric";
      input.placeholder = "完成分钟";
      input.value = completed > 0 ? completed : "";
      input.dataset.workoutGoalMinutes = goal.id;
      input.disabled = todayRecord.sealed;
      var unit = document.createElement("b");
      unit.textContent = "min";
      inputWrap.append(input, unit);
      var save = document.createElement("button");
      save.type = "button";
      save.textContent = "记录";
      save.dataset.workoutGoalSave = goal.id;
      save.disabled = todayRecord.sealed;
      minutes.append(inputWrap, save);
      row.append(main, minutes);
      list.appendChild(row);
    });
  }

  function renderWaterTracker() {
    if (!todayRecord) return;
    var amount = Number(todayRecord.waterMl || 0);
    var goal = normalizeWaterGoal(todayRecord.waterGoalMl);
    var ratio = Math.min(100, amount / goal * 100);
    setText("waterAmountValue", amount);
    setText("waterRecordStatus", Math.round(ratio) + "%");
    setText("waterGoalLabel", goal);
    setText("waterMark100", formatWaterMark(goal));
    setText("waterMark75", formatWaterMark(goal * 0.75));
    setText("waterMark50", formatWaterMark(goal * 0.5));
    setText("waterMark25", formatWaterMark(goal * 0.25));
    document.getElementById("waterAmountInput").value = amount || "";
    document.getElementById("waterColumnFill").style.height = ratio + "%";
    document.getElementById("saveWaterButton").disabled = todayRecord.sealed;
    document.getElementById("editWaterGoalButton").disabled = todayRecord.sealed;
    document.querySelectorAll("[data-water-add]").forEach(function (button) { button.disabled = todayRecord.sealed; });
  }

  function formatWaterMark(value) {
    var liters = Number(value || 0) / 1000;
    return (Math.round(liters * 100) / 100).toString().replace(/\.0+$/, "") + "L";
  }

  function callTaskSummary(record, task) {
    if (task.kind === "meals") return "已记录 " + mealCount(record) + "/3 餐";
    if (task.kind === "workout") return "完成 " + workoutCompletedGoalCount(record) + "/" + workoutGoals(record).length + " 项 · " + workoutTotalMinutes(record) + "/" + workoutTargetMinutes(record) + " 分钟";
    if (task.kind === "water") return "已记录 " + Number(record.waterMl || 0) + "/" + normalizeWaterGoal(record.waterGoalMl) + "ml";
    if (task.kind === "measurements") {
      var entries = measurementEntries(record);
      return entries.length ? "已记录 " + entries.map(function (entry) { return entry.label; }).join("、") : "腰围、腿围等任选一项";
    }
    return task.completed ? "今天已完成" : "点击进入记录页打卡";
  }

  function renderCallSheet() {
    var list = document.getElementById("callSheetList");
    if (!list || !todayRecord) return;
    list.replaceChildren();
    callSheetTasks(todayRecord).forEach(function (task) {
      var catalog = BUILT_IN_CALL_TASKS[task.kind] || { icon: "circle-check-big", color: "custom" };
      var done = callTaskComplete(todayRecord, task);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "call-item" + (done ? " is-done" : "");
      button.dataset.taskJump = task.kind === "custom" ? "custom" : task.kind;
      button.disabled = done;
      var icon = document.createElement("span");
      icon.className = "call-item__icon call-item__icon--" + catalog.color;
      icon.innerHTML = '<i data-lucide="' + catalog.icon + '"></i>';
      var copy = document.createElement("span");
      var title = document.createElement("strong");
      var summary = document.createElement("small");
      title.textContent = task.label;
      summary.textContent = callTaskSummary(todayRecord, task);
      copy.append(title, summary);
      var status = document.createElement("b");
      status.textContent = done ? "已完成" : "去记录";
      button.append(icon, copy, status);
      list.appendChild(button);
    });
    var total = taskTotalCount(todayRecord);
    var doneCount = taskDoneCount(todayRecord);
    setText("taskDoneCount", doneCount + "/" + total);
    setText("callSheetRule", doneCount >= MIN_DAILY_TASKS ? "今日已达标，还可以继续完成其他通告" : "再完成 " + (MIN_DAILY_TASKS - doneCount) + " 项，今日通告即可达标");
    document.getElementById("editCallSheetButton").disabled = todayRecord.sealed;
  }

  function renderMeasurements() {
    if (!todayRecord) return;
    var values = normalizeMeasurements(todayRecord.measurements);
    ["waist", "thigh", "calf", "bust"].forEach(function (key) {
      document.getElementById(key + "Input").value = values[key] === null ? "" : values[key];
    });
    document.getElementById("otherMeasurementName").value = values.otherName;
    document.getElementById("otherMeasurementValue").value = values.otherValue === null ? "" : values.otherValue;
    var selected = Boolean(callTask(todayRecord, "measurements"));
    setText("measurementTaskState", selected ? (measurementsMet(todayRecord) ? "已完成" : "今日通告") : "选填");
    document.getElementById("saveMeasurementsButton").disabled = todayRecord.sealed;
  }

  function renderCustomTaskChecklist() {
    var block = document.getElementById("customTaskRecordBlock");
    var list = document.getElementById("customTaskRecordList");
    if (!block || !list || !todayRecord) return;
    var tasks = callSheetTasks(todayRecord).filter(function (task) { return task.kind === "custom"; });
    block.hidden = !tasks.length;
    list.replaceChildren();
    tasks.forEach(function (task) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "custom-task-check" + (task.completed ? " is-complete" : "");
      button.dataset.customTaskCheck = task.id;
      button.disabled = todayRecord.sealed;
      button.innerHTML = '<span><i data-lucide="check"></i></span><strong></strong><b>' + (task.completed ? "已完成" : "点击打卡") + "</b>";
      button.querySelector("strong").textContent = task.label;
      list.appendChild(button);
    });
    setText("customTaskRecordCount", tasks.filter(function (task) { return task.completed; }).length + "/" + tasks.length);
  }

  function renderTasks() {
    if (!todayRecord) return;
    normalizeDailyRecord(todayRecord);
    var meals = mealCount(todayRecord);
    var actualMinutes = workoutTotalMinutes(todayRecord);
    var planMinutes = workoutTargetMinutes(todayRecord);
    var goalCount = workoutGoals(todayRecord).length;
    var completedGoals = workoutCompletedGoalCount(todayRecord);
    var met = workoutMet(todayRecord);
    renderCallSheet();
    document.getElementById("mealRecordBlock").hidden = !callTask(todayRecord, "meals");
    document.getElementById("workoutRecordBlock").hidden = !callTask(todayRecord, "workout");
    document.getElementById("waterRecordBlock").hidden = !callTask(todayRecord, "water");
    setText("mealRecordCount", meals + "/3");
    MEAL_KEYS.forEach(function (key) {
      var meal = todayRecord.meals[key];
      var button = document.querySelector('[data-meal="' + key + '"]');
      button.classList.toggle("is-logged", meal.logged);
      button.querySelector("strong").textContent = meal.logged ? meal.note : "待记录";
      button.querySelector("em").textContent = meal.calories !== null ? meal.calories + " kcal" : "热量选填";
      var icon = button.querySelector("svg");
      if (icon) icon.outerHTML = meal.logged ? '<i data-lucide="check"></i>' : '<i data-lucide="plus"></i>';
      button.disabled = todayRecord.sealed;
    });
    setText("workoutPlanText", goalCount + " 项 · 共 " + planMinutes + " 分钟");
    var workoutRatio = planMinutes > 0 ? Math.min(100, actualMinutes / planMinutes * 100) : 0;
    document.getElementById("workoutMeterBar").style.width = workoutRatio + "%";
    setText("workoutHint", met ? "所有运动目标都已完成，可以等待晚间结算。" : completedGoals + "/" + goalCount + " 项完成；没做满的项目可以填写实际分钟。 ");
    renderWorkoutEntryList();
    renderWaterTracker();
    renderMeasurements();
    renderCustomTaskChecklist();
    document.getElementById("editTodayWeightButton").disabled = todayRecord.sealed;
    document.getElementById("editWorkoutPlanButton").disabled = todayRecord.sealed;
    document.getElementById("businessPhotoButton").disabled = todayRecord.sealed;
    document.getElementById("removeBusinessPhotoButton").disabled = todayRecord.sealed;
    document.querySelectorAll(".record-block").forEach(function (block) { block.classList.toggle("is-locked", todayRecord.sealed); });
    document.getElementById("sealedBanner").hidden = !todayRecord.sealed;
    document.getElementById("finishDayButton").hidden = todayRecord.sealed;
    if (todayRecord.businessPhoto) document.getElementById("businessPhotoPreview").src = todayRecord.businessPhoto;
    document.getElementById("businessPhotoPreview").hidden = !todayRecord.businessPhoto;
    document.getElementById("businessPhotoEmpty").hidden = Boolean(todayRecord.businessPhoto);
    document.getElementById("removeBusinessPhotoButton").hidden = !todayRecord.businessPhoto;
    refreshIcons();
  }

  function setActiveView(viewName, options) {
    var target = document.querySelector('[data-view="' + viewName + '"]');
    if (!target) return;
    document.querySelectorAll(".app-view").forEach(function (view) { view.classList.toggle("is-active", view === target); });
    document.querySelectorAll(".nav-item").forEach(function (button) { button.classList.toggle("is-active", button.dataset.viewTarget === viewName); });
    document.body.classList.toggle("is-subview", viewName === "manager" || viewName === "fan");
    if (["today", "record", "progress", "profile"].includes(viewName)) state.activeView = viewName;
    saveSettings();
    if (viewName === "progress") renderProgress();
    if (viewName === "profile") renderProfileData();
    if (viewName === "manager") renderManager();
    if (viewName === "fan") renderFanCommunity();
    window.scrollTo(0, 0);
    if (window.EveMotion && !(options && options.immediate)) window.EveMotion.viewEnter(target);
  }

  function renderAll() {
    renderProfileData();
    renderTasks();
    renderManager();
    renderFanCommunity();
    document.body.dataset.archiveReady = "true";
  }

  function showMainApp(viewName) {
    document.getElementById("bootScreen").hidden = true;
    document.getElementById("onboardingShell").hidden = true;
    document.getElementById("dailyCheckin").hidden = true;
    document.getElementById("outcomeScreen").hidden = true;
    document.getElementById("mainApp").hidden = false;
    renderAll();
    setActiveView(viewName || state.activeView || "today", { immediate: true });
    refreshIcons();
    promptLegacyTargetRepair();
  }

  function openProfileAfterOnboarding() {
    showMainApp("profile");
    document.getElementById("enterTodayButton").hidden = state.trainingStarted;
    if (window.EveMotion) window.EveMotion.profileReveal();
  }

  function openFirstDayTutorial() {
    if (state.tutorialSeen) return;
    var overlay = document.getElementById("firstDayTutorial");
    overlay._motionSequence = Number(overlay._motionSequence || 0) + 1;
    overlay.hidden = false;
    document.body.classList.add("has-sheet");
    refreshIcons();
    if (window.EveMotion) window.EveMotion.openConfirm(overlay);
  }

  function completeFirstDayTutorial() {
    var overlay = document.getElementById("firstDayTutorial");
    if (overlay.hidden) return;
    state.tutorialSeen = true;
    state.tutorialPending = false;
    saveSettings();
    var sequence = Number(overlay._motionSequence || 0) + 1;
    overlay._motionSequence = sequence;
    var finish = function () {
      if (overlay._motionSequence !== sequence) return;
      overlay.hidden = true;
      if (!document.querySelector(".sheet-overlay:not([hidden]), .confirm-overlay:not([hidden])")) document.body.classList.remove("has-sheet");
    };
    if (window.EveMotion) window.EveMotion.closeConfirm(overlay, finish);
    else finish();
    window.setTimeout(finish, 420);
  }

  function enterTodayFromProfile() {
    state.trainingStarted = true;
    state.tutorialPending = !state.tutorialSeen;
    state.activeView = "today";
    document.getElementById("enterTodayButton").hidden = true;
    saveSettings();
    setActiveView("today");
    if (state.tutorialPending) window.setTimeout(openFirstDayTutorial, 220);
  }

  function classifyWeight(record, weight) {
    if (state.profile.mode === "maintenance") {
      var center = Number(state.profile.maintenanceCenter);
      return Math.abs(weight - center) <= 0.5 ? "maintenance" : "behind";
    }
    if (weight <= plannedWeightValue(record) + 0.001) return "achieved";
    if (weight < Number(record.previousWeight) - 0.001) return "progress";
    return "behind";
  }

  function morningFanValue(record, status) {
    var gainRange = fanStageRange("morningGain");
    var progressRange = fanStageRange("progressLoss");
    var behindRange = fanStageRange("behindLoss");
    if (status === "achieved") return seededRange(record.date, "morning-achieved", gainRange[0], gainRange[1]);
    if (status === "maintenance") return seededRange(record.date, "morning-maintenance", gainRange[0], gainRange[1]);
    if (status === "progress") return -seededRange(record.date, "morning-progress", progressRange[0], progressRange[1]);
    return -seededRange(record.date, "morning-behind", behindRange[0], behindRange[1]);
  }

  function removeCurrentDayReward(date) {
    state.rewards = state.rewards.filter(function (reward) { return reward.sourceDate !== date; });
  }

  function createReward(date) {
    var foods = state.profile.favoriteFoods && state.profile.favoriteFoods.length ? state.profile.favoriteFoods : ["喜欢的食物"];
    var index = seededRange(date, "reward-food", 0, foods.length - 1);
    var food = foods[index];
    var reward = { id: "reward-" + date + "-" + Date.now(), sourceDate: date, food: food, unlockedDate: date, usedDate: "" };
    state.rewards.push(reward);
    return reward;
  }

  function applyMorningSettlement(record, weight) {
    var status = classifyWeight(record, weight);
    var baseFans = record.fansBeforeMorning;
    if (typeof baseFans !== "number") baseFans = state.fans;
    record.fansBeforeMorning = baseFans;
    state.rewardProgress = Number(record.rewardProgressBefore || 0);
    state.streak = Number(record.streakBefore || 0);
    state.behindStreak = Number(record.behindStreakBefore || 0);
    removeCurrentDayReward(record.date);
    var rewardUnlocked = null;
    if (status === "achieved" || status === "maintenance") {
      state.rewardProgress += 1;
      state.streak += 1;
      state.behindStreak = 0;
      if (state.rewardProgress >= 3) {
        rewardUnlocked = createReward(record.date);
        state.rewardProgress = 0;
      }
    } else {
      state.rewardProgress = Math.max(0, state.rewardProgress - 1);
      state.streak = 0;
      state.behindStreak = status === "behind" ? state.behindStreak + 1 : 0;
    }
    var morningFans = morningFanValue(record, status);
    var penaltyRange = fanStageRange("longPenalty");
    var penalty = status === "behind" && state.behindStreak > 0 && state.behindStreak % 3 === 0
      ? -seededRange(record.date, "long-term-penalty", penaltyRange[0], penaltyRange[1])
      : 0;
    record.weight = Number(weight);
    record.weightSubmitted = true;
    record.weightStatus = status;
    record.morningFans = morningFans;
    record.longTermPenalty = penalty;
    record.morningSettled = true;
    record.rewardProgressAfter = state.rewardProgress;
    record.streakAfter = state.streak;
    record.behindStreakAfter = state.behindStreak;
    record.rewardUnlockedId = rewardUnlocked ? rewardUnlocked.id : "";
    state.fans = Math.max(0, baseFans + morningFans + penalty);
    record.fanTotalAfter = state.fans;
    upsertManagerMessage({
      id: managerMessageId(record.date, "morning"),
      date: record.date,
      side: "manager",
      time: "晨间报到",
      text: managerDailyText(record)
    });
    return rewardUnlocked;
  }

  function morningReply(record) {
    var deltaFromYesterday = Number(record.weight) - Number(record.previousWeight);
    var targetDifference = Number(record.weight) - plannedWeightValue(record);
    if (record.weightStatus === "achieved") return Math.abs(targetDifference) < 0.005
      ? "今天正好守住计划线。照原任务走，不临时加练。"
      : "今天比计划线多推进 " + formatWeightDifference(targetDifference) + "kg。够了，不追加任务。";
    if (record.weightStatus === "maintenance") return "体重还在合适的维持区间。今天正常吃饭，完成基础记录就好。";
    if (record.weightStatus === "progress") return "比昨天轻了 " + formatWeightDifference(deltaFromYesterday) + "kg，方向没错，但离今天的计划线还差 " + formatWeightDifference(targetDifference) + "kg，未达标。";
    return "比今天的计划线高 " + formatWeightDifference(Math.max(0, targetDifference)) + "kg，未达标。先别慌，也不许极端补进度，按原任务走。";
  }

  function prepareDailyCheckin(editing) {
    if (!todayRecord) return;
    document.getElementById("mainApp").hidden = true;
    document.getElementById("dailyCheckin").hidden = false;
    document.getElementById("weightCheckinCard").hidden = false;
    document.getElementById("morningResult").hidden = true;
    setText("dailyCheckinCountdown", "D-" + daysUntil(state.profile.debutDate));
    setText("dailyCheckinDate", formatDateLabel(todayRecord.date));
    setText("dailyCheckinTitle", editing ? "修正今天的体重。结算幅度固定，不会重新抽取。" : "先报今天的体重，再进入工作台。");
    document.getElementById("dailyWeightInput").value = Number(todayRecord.weight || todayRecord.previousWeight).toFixed(1);
    setText("weightTargetHint", state.profile.mode === "maintenance" ? "今日维持区间 " + (Number(state.profile.maintenanceCenter) - 0.5).toFixed(1) + "–" + (Number(state.profile.maintenanceCenter) + 0.5).toFixed(1) + "kg" : "今日计划线 " + plannedWeightValue(todayRecord).toFixed(2) + "kg");
    var carryover = state.pendingCarryover;
    setHidden("carryoverMessage", !carryover || editing);
    if (carryover && !editing) setText("carryoverText", carryover.text);
    refreshIcons();
    if (window.EveMotion) window.EveMotion.dailyCheckin();
  }

  async function submitDailyWeight() {
    var value = Number(document.getElementById("dailyWeightInput").value);
    if (!value || value < 30 || value > 250) {
      showToast("请填写有效体重");
      return;
    }
    var reward = applyMorningSettlement(todayRecord, value);
    state.pendingCarryover = null;
    await saveRecord(todayRecord);
    setText("morningStatusLabel", STATUS_LABELS[todayRecord.weightStatus]);
    setText("morningStatusValue", value.toFixed(1) + "kg");
    setText("morningManagerReply", morningReply(todayRecord) + (todayRecord.longTermPenalty ? " 连续三天落后，出现额外掉粉。" : ""));
    setText("morningFanDelta", signedNumber(Number(todayRecord.morningFans || 0) + Number(todayRecord.longTermPenalty || 0)));
    setText("morningRewardProgress", state.rewardProgress + "/3" + (reward ? " · 已解锁" : ""));
    document.querySelectorAll(".reward-progress-mini i").forEach(function (dot, index) { dot.classList.toggle("is-filled", index < state.rewardProgress); });
    document.getElementById("weightCheckinCard").hidden = true;
    revealElement(document.getElementById("morningResult"));
    renderAll();
    if (window.EveMotion) window.EveMotion.morningResult(document.getElementById("morningResult"));
  }

  async function enterWorkspaceAfterMorning() {
    showMainApp("today");
    await maybeShowOutcome();
  }

  function adjustDailyWeight(amount) {
    var input = document.getElementById("dailyWeightInput");
    var value = Number(input.value || todayRecord.previousWeight || state.profile.startWeight) + amount;
    input.value = Math.max(30, Math.min(250, value)).toFixed(1);
  }

  function openMealSheet(key) {
    if (!todayRecord || todayRecord.sealed) return;
    activeMeal = key;
    var meal = todayRecord.meals[key];
    pendingMealPhoto = meal.photo || "";
    setText("mealSheetTitle", "记录" + MEAL_LABELS[key]);
    document.getElementById("mealNoteInput").value = meal.note || "";
    document.getElementById("mealCaloriesInput").value = meal.calories !== null ? meal.calories : "";
    setText("mealNoteCount", (meal.note || "").length);
    setHidden("mealSheetError", true);
    document.getElementById("mealPhotoPreview").src = pendingMealPhoto;
    document.getElementById("mealPhotoPreview").hidden = !pendingMealPhoto;
    document.getElementById("mealPhotoEmpty").hidden = Boolean(pendingMealPhoto);
    document.getElementById("removeMealPhotoButton").hidden = !pendingMealPhoto;
    document.getElementById("deleteMealButton").hidden = !meal.logged;
    openSheet("mealSheet");
  }

  async function saveMeal() {
    if (!activeMeal || !todayRecord || todayRecord.sealed) return;
    var note = document.getElementById("mealNoteInput").value.trim();
    var calorieValue = document.getElementById("mealCaloriesInput").value.trim();
    var calories = calorieValue === "" ? null : Number(calorieValue);
    if (!note) {
      setHidden("mealSheetError", false);
      return;
    }
    if (calories !== null && (!Number.isFinite(calories) || calories < 0 || calories > 5000)) {
      setText("mealSheetError", "热量请填写 0～5000 之间的数字，也可以留空。");
      setHidden("mealSheetError", false);
      return;
    }
    todayRecord.meals[activeMeal] = { logged: true, note: note, photo: pendingMealPhoto || "", calories: calories === null ? null : Math.round(calories) };
    await saveRecord(todayRecord);
    closeSheet("mealSheet");
    renderTasks();
    showToast(MEAL_LABELS[activeMeal] + "已记录");
    maybePromptAutomaticSettlement();
  }

  async function deleteMeal() {
    if (!activeMeal || todayRecord.sealed) return;
    todayRecord.meals[activeMeal] = { logged: false, note: "", photo: "", calories: null };
    await saveRecord(todayRecord);
    closeSheet("mealSheet");
    renderTasks();
    showToast("这餐记录已删除");
  }

  function openWorkoutPlanSheet() {
    if (!todayRecord || todayRecord.sealed) return;
    workoutPlanDraft = workoutGoals(todayRecord).map(function (goal) { return { id: goal.id, type: goal.type, minutes: goal.minutes }; });
    document.getElementById("workoutPlanType").value = "";
    document.getElementById("workoutPlanMinutes").value = "";
    renderWorkoutPlanDraft();
    openSheet("workoutPlanSheet");
  }

  function renderWorkoutPlanDraft() {
    var list = document.getElementById("workoutGoalPlanList");
    list.replaceChildren();
    if (!workoutPlanDraft.length) {
      var empty = document.createElement("div");
      empty.className = "workout-goal-plan-empty";
      empty.textContent = "还没有目标，请先添加今天要完成的运动。";
      list.appendChild(empty);
      return;
    }
    workoutPlanDraft.forEach(function (goal, index) {
      var row = document.createElement("div");
      row.className = "workout-goal-plan-row";
      var icon = document.createElement("span");
      icon.innerHTML = '<i data-lucide="activity"></i>';
      var copy = document.createElement("div");
      var title = document.createElement("strong");
      var order = document.createElement("small");
      title.textContent = goal.type;
      order.textContent = "目标 " + (index + 1);
      copy.append(title, order);
      var minutes = document.createElement("b");
      minutes.textContent = goal.minutes + " 分钟";
      var remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.workoutPlanDelete = goal.id;
      remove.setAttribute("aria-label", "删除" + goal.type + "目标");
      remove.innerHTML = '<i data-lucide="trash-2"></i>';
      row.append(icon, copy, minutes, remove);
      list.appendChild(row);
    });
    refreshIcons();
  }

  function addWorkoutGoalToDraft(silent) {
    var type = document.getElementById("workoutPlanType").value.trim();
    var minutes = Number(document.getElementById("workoutPlanMinutes").value);
    if (!type || !minutes || minutes < 5 || minutes > 300) {
      if (!silent) showToast("请填写运动类型和 5～300 分钟目标");
      return false;
    }
    if (workoutPlanDraft.length >= 8) {
      showToast("每天最多设置 8 项运动目标");
      return false;
    }
    workoutPlanDraft.push({ id: "goal-draft-" + Date.now(), type: type, minutes: Math.round(minutes) });
    document.getElementById("workoutPlanType").value = "";
    document.getElementById("workoutPlanMinutes").value = "";
    renderWorkoutPlanDraft();
    return true;
  }

  function removeWorkoutGoalFromDraft(goalId) {
    workoutPlanDraft = workoutPlanDraft.filter(function (goal) { return goal.id !== goalId; });
    renderWorkoutPlanDraft();
  }

  async function saveWorkoutPlan() {
    var pendingType = document.getElementById("workoutPlanType").value.trim();
    var pendingMinutes = document.getElementById("workoutPlanMinutes").value.trim();
    if ((pendingType || pendingMinutes) && !addWorkoutGoalToDraft(false)) return;
    if (!workoutPlanDraft.length) {
      showToast("请至少保留一项运动目标");
      return;
    }
    var previousGoals = workoutGoals(todayRecord);
    todayRecord.workoutGoals = workoutPlanDraft.map(function (goal) {
      var previous = previousGoals.find(function (item) { return item.id === goal.id; });
      return { id: goal.id, type: goal.type, minutes: goal.minutes, completedMinutes: previous ? Number(previous.completedMinutes || 0) : 0 };
    });
    syncWorkoutCompatibility(todayRecord, true);
    state.plan.lastWorkoutGoals = workoutPlanDraft.map(function (goal, index) { return { id: "template-" + index, type: goal.type, minutes: goal.minutes }; });
    state.plan.lastWorkoutPlan = clone(todayRecord.workoutPlan);
    autoSettlementPrompted = false;
    await saveRecord(todayRecord);
    closeSheet("workoutPlanSheet");
    renderTasks();
    showToast("今日 " + workoutPlanDraft.length + " 项运动计划已确认");
    maybePromptAutomaticSettlement();
  }

  function openCallSheetEditor() {
    if (!todayRecord || todayRecord.sealed) return;
    callSheetDraft = callSheetTasks(todayRecord).map(function (task) { return clone(task); });
    setHidden("callSheetEditorError", true);
    document.getElementById("customCallSheetInput").value = "";
    renderCallSheetEditor();
    openSheet("callSheetEditor");
  }

  function renderCallSheetEditor() {
    var options = document.getElementById("callSheetBuiltinOptions");
    var customList = document.getElementById("customCallSheetDraftList");
    options.replaceChildren();
    Object.keys(BUILT_IN_CALL_TASKS).forEach(function (kind) {
      var catalog = BUILT_IN_CALL_TASKS[kind];
      var selected = callSheetDraft.some(function (task) { return task.kind === kind; });
      var button = document.createElement("button");
      button.type = "button";
      button.className = "call-sheet-option" + (selected ? " is-selected" : "");
      button.dataset.callSheetBuiltin = kind;
      button.setAttribute("aria-pressed", String(selected));
      button.innerHTML = '<span class="call-item__icon call-item__icon--' + catalog.color + '"><i data-lucide="' + catalog.icon + '"></i></span><strong></strong><b><i data-lucide="check"></i></b>';
      button.querySelector("strong").textContent = catalog.label;
      options.appendChild(button);
    });
    customList.replaceChildren();
    callSheetDraft.filter(function (task) { return task.kind === "custom"; }).forEach(function (task) {
      var row = document.createElement("div");
      row.className = "custom-call-draft-row";
      var label = document.createElement("span");
      label.textContent = task.label;
      var remove = document.createElement("button");
      remove.type = "button";
      remove.dataset.callSheetCustomRemove = task.id;
      remove.setAttribute("aria-label", "删除" + task.label);
      remove.innerHTML = '<i data-lucide="trash-2"></i>';
      row.append(label, remove);
      customList.appendChild(row);
    });
    refreshIcons();
  }

  function toggleCallSheetBuiltin(kind) {
    if (!BUILT_IN_CALL_TASKS[kind]) return;
    var existing = callSheetDraft.find(function (task) { return task.kind === kind; });
    if (existing) callSheetDraft = callSheetDraft.filter(function (task) { return task.kind !== kind; });
    else callSheetDraft.push({ id: kind, kind: kind, label: BUILT_IN_CALL_TASKS[kind].label, completed: false });
    setHidden("callSheetEditorError", true);
    renderCallSheetEditor();
  }

  function addCustomCallSheetTask() {
    var input = document.getElementById("customCallSheetInput");
    var label = input.value.trim();
    var customCount = callSheetDraft.filter(function (task) { return task.kind === "custom"; }).length;
    if (!label) {
      showToast("先写下要增加的通告");
      return;
    }
    if (customCount >= MAX_CUSTOM_TASKS) {
      showToast("每天最多添加 5 项自定义通告");
      return;
    }
    if (callSheetDraft.some(function (task) { return task.label === label; })) {
      showToast("这项通告已经在清单里了");
      return;
    }
    callSheetDraft.push({ id: todayValue() + "-custom-" + Date.now(), kind: "custom", label: label.slice(0, 20), completed: false });
    input.value = "";
    setHidden("callSheetEditorError", true);
    renderCallSheetEditor();
  }

  function removeCustomCallSheetTask(taskId) {
    callSheetDraft = callSheetDraft.filter(function (task) { return task.id !== taskId; });
    renderCallSheetEditor();
  }

  async function saveCallSheet() {
    if (!todayRecord || todayRecord.sealed) return;
    if (callSheetDraft.length < MIN_DAILY_TASKS) {
      setText("callSheetEditorError", "请至少保留 2 项通告。运动不是必选项，可以换成其他任务。");
      setHidden("callSheetEditorError", false);
      return;
    }
    var previous = callSheetTasks(todayRecord);
    todayRecord.callSheet = callSheetDraft.map(function (task) {
      var old = previous.find(function (item) { return item.id === task.id; });
      return { id: task.id, kind: task.kind, label: task.label, completed: task.kind === "custom" ? Boolean(old ? old.completed : task.completed) : false };
    });
    state.plan.lastCallSheetTemplate = todayRecord.callSheet.map(function (task, index) {
      return { id: task.kind === "custom" ? "custom-template-" + index : task.kind, kind: task.kind, label: task.label };
    });
    autoSettlementPrompted = false;
    await saveRecord(todayRecord);
    closeSheet("callSheetEditor");
    renderTasks();
    showToast("今日通告已更新，完成任意 2 项即可达标");
    maybePromptAutomaticSettlement();
  }

  function findWorkoutGoal(goalId) {
    return workoutGoals(todayRecord).find(function (goal) { return goal.id === goalId; });
  }

  async function setWorkoutGoalMinutes(goalId, minutes, message) {
    if (!todayRecord || todayRecord.sealed) return;
    var goal = findWorkoutGoal(goalId);
    var value = Number(minutes);
    if (!goal || !Number.isFinite(value) || value < 0 || value > 600) {
      showToast("完成分钟请填写 0～600 之间的数字");
      return;
    }
    goal.completedMinutes = Math.round(value);
    syncWorkoutCompatibility(todayRecord, true);
    await saveRecord(todayRecord);
    renderTasks();
    showToast(message || (goal.completedMinutes >= goal.minutes ? goal.type + "已完成" : goal.type + "已记录 " + goal.completedMinutes + " 分钟"));
    maybePromptAutomaticSettlement();
  }

  function toggleWorkoutGoal(goalId) {
    var goal = findWorkoutGoal(goalId);
    if (!goal) return;
    var complete = Number(goal.completedMinutes || 0) >= Number(goal.minutes || 0);
    setWorkoutGoalMinutes(goalId, complete ? 0 : goal.minutes, complete ? "已撤销完成状态" : goal.type + "已完成");
  }

  function savePartialWorkoutGoal(goalId) {
    var input = document.querySelector('[data-workout-goal-minutes="' + goalId + '"]');
    if (input) setWorkoutGoalMinutes(goalId, input.value);
  }

  async function saveWaterAmount(amount, message) {
    if (!todayRecord || todayRecord.sealed) return;
    var value = Number(amount);
    if (!Number.isFinite(value) || value < 0 || value > 8000) {
      showToast("喝水量请填写 0～8000ml");
      return;
    }
    todayRecord.waterMl = Math.round(value);
    await saveRecord(todayRecord);
    renderTasks();
    showToast(message || (waterMet(todayRecord) ? "今日 " + formatWaterMark(todayRecord.waterGoalMl) + " 喝水目标已完成" : "喝水量已保存"));
    maybePromptAutomaticSettlement();
  }

  function saveWaterFromInput() {
    saveWaterAmount(document.getElementById("waterAmountInput").value, "喝水量已保存");
  }

  function addWater(amount) {
    saveWaterAmount(Math.min(8000, Number(todayRecord && todayRecord.waterMl || 0) + Number(amount || 0)), "已补记 " + amount + "ml");
  }

  function openWaterGoalEditor() {
    if (!todayRecord || todayRecord.sealed) return;
    document.getElementById("waterGoalInput").value = normalizeWaterGoal(todayRecord.waterGoalMl);
    setHidden("waterGoalError", true);
    openSheet("waterGoalSheet");
  }

  async function saveWaterGoal() {
    if (!todayRecord || todayRecord.sealed) return;
    var goal = Number(document.getElementById("waterGoalInput").value);
    if (!Number.isFinite(goal) || goal < 300 || goal > 5000) {
      setHidden("waterGoalError", false);
      return;
    }
    todayRecord.waterGoalMl = Math.round(goal);
    state.plan.lastWaterGoalMl = todayRecord.waterGoalMl;
    autoSettlementPrompted = false;
    await saveRecord(todayRecord);
    closeSheet("waterGoalSheet");
    renderTasks();
    showToast("今日喝水目标已改为 " + todayRecord.waterGoalMl + "ml");
    maybePromptAutomaticSettlement();
  }

  async function saveMeasurements() {
    if (!todayRecord || todayRecord.sealed) return;
    var ranges = { waist: [20, 250], thigh: [15, 150], calf: [10, 100], bust: [30, 250] };
    var values = {};
    var invalid = false;
    Object.keys(ranges).forEach(function (key) {
      var raw = document.getElementById(key + "Input").value.trim();
      var number = raw === "" ? null : Number(raw);
      if (number !== null && (!Number.isFinite(number) || number < ranges[key][0] || number > ranges[key][1])) invalid = true;
      values[key] = number === null ? null : Math.round(number * 10) / 10;
    });
    var otherName = document.getElementById("otherMeasurementName").value.trim();
    var otherRaw = document.getElementById("otherMeasurementValue").value.trim();
    var otherValue = otherRaw === "" ? null : Number(otherRaw);
    if ((otherName && otherValue === null) || (!otherName && otherValue !== null) || (otherValue !== null && (!Number.isFinite(otherValue) || otherValue < 5 || otherValue > 300))) invalid = true;
    if (invalid) {
      setHidden("measurementError", false);
      return;
    }
    setHidden("measurementError", true);
    todayRecord.measurements = normalizeMeasurements(Object.assign(values, { otherName: otherName, otherValue: otherValue }));
    await saveRecord(todayRecord);
    renderTasks();
    showToast(measurementsMet(todayRecord) ? "今日围度已保存" : "今日围度记录已清空");
    maybePromptAutomaticSettlement();
  }

  async function toggleCustomTask(taskId) {
    if (!todayRecord || todayRecord.sealed) return;
    var task = callSheetTasks(todayRecord).find(function (item) { return item.id === taskId && item.kind === "custom"; });
    if (!task) return;
    task.completed = !task.completed;
    await saveRecord(todayRecord);
    renderTasks();
    showToast(task.completed ? task.label + "已完成" : "已撤销完成状态");
    maybePromptAutomaticSettlement();
  }

  async function setBusinessPhoto(dataUrl) {
    if (!todayRecord || todayRecord.sealed) return;
    todayRecord.businessPhoto = dataUrl || "";
    pendingBusinessPhoto = todayRecord.businessPhoto;
    await saveRecord(todayRecord);
    renderTasks();
    renderFanCommunity();
    showToast(dataUrl ? "营业照已进入训练相册" : "营业照已移除");
  }

  function settlementRows(record) {
    var rows = callSheetTasks(record).map(function (task) {
      var done = callTaskComplete(record, task);
      var value = callTaskSummary(record, task);
      if (task.kind === "meals") value = mealCount(record) + "/3 餐";
      if (task.kind === "workout") value = workoutCompletedGoalCount(record) + "/" + workoutGoals(record).length + " 项";
      if (task.kind === "water") value = Number(record.waterMl || 0) + "/" + normalizeWaterGoal(record.waterGoalMl) + "ml";
      return { label: task.label, done: done, value: done ? "完成 · " + value : value };
    });
    rows.push({ label: "营业照（选填）", done: Boolean(record.businessPhoto), value: record.businessPhoto ? "额外加成" : "未上传" });
    return rows;
  }

  function openSettlementSheet() {
    if (!todayRecord || todayRecord.sealed) return;
    var score = taskDoneCount(todayRecord);
    var total = taskTotalCount(todayRecord);
    setText("settlementScore", score + "/" + total);
    setText("settlementSummary", allCallTasksComplete(todayRecord)
      ? "今日通告全部完成，可以封档。"
      : baseTasksComplete(todayRecord) ? "已完成至少 2 项，今日达标；其余通告会按当前进度保存。" : "还未完成 2 项，今天会按未达标结算。营业照始终是选填加成。");
    var list = document.getElementById("settlementList");
    list.replaceChildren();
    settlementRows(todayRecord).forEach(function (item) {
      var row = document.createElement("div");
      row.className = "settlement-row";
      var label = document.createElement("span");
      var value = document.createElement("b");
      label.textContent = item.label;
      value.textContent = item.value;
      row.append(label, value);
      list.appendChild(row);
    });
    openSheet("settlementSheet");
  }

  function maybePromptAutomaticSettlement() {
    if (!todayRecord || todayRecord.sealed || autoSettlementPrompted) return;
    if (allCallTasksComplete(todayRecord)) {
      autoSettlementPrompted = true;
      window.setTimeout(openSettlementSheet, 280);
    }
  }

  function openFanGrowthPrompt(delta) {
    var commentCount = fanCommentQuantity();
    setText("fanGrowthPromptDelta", signedNumber(delta));
    setText("fanGrowthPromptLabel", delta > 0 ? "今日新增" : "今日变化");
    setText("fanGrowthPromptCopy", commentCount > 0
      ? "训练贴下面已经有 " + commentCount + " 条新留言，去看看第一批关注你的人在说什么。"
      : "今天的训练档案已经收好。先看看反馈，再为明天留一点期待。");
    setText("tomorrowReminderTitle", daysUntil(state.profile.debutDate) > 0 ? "明早 6:00 后再来打卡" : "本轮训练已完成");
    setText("tomorrowReminderText", daysUntil(state.profile.debutDate) > 0
      ? "再次打开后会刷新新的通告和经纪人消息，继续向第一次舞台推进。"
      : "最后一份训练档案已完成，接下来查看本轮出道结果。");
    openSheet("fanGrowthSheet");
  }

  function viewFanComments() {
    closeSheet("fanGrowthSheet");
    setActiveView("fan");
  }

  async function confirmEveningSettlement() {
    if (!todayRecord || todayRecord.sealed) return;
    var delta = settleEvening(todayRecord, false);
    await saveRecord(todayRecord);
    closeSheet("settlementSheet");
    renderAll();
    showToast("晚间结算 " + signedNumber(delta) + " 粉丝");
    setActiveView("today");
    window.setTimeout(function () { openFanGrowthPrompt(delta); }, 520);
  }

  function renderManager() {
    var log = document.getElementById("managerChatLog");
    if (!log) return;
    log.replaceChildren();
    var messages = state.managerMessages.slice(0, 30).reverse();
    if (!messages.length) messages = [{ side: "manager", time: "刚刚", text: managerScenarioMessage(todayValue(), todayRecord) }];
    messages.forEach(function (message) {
      var row = document.createElement("div");
      row.className = "manager-chat-row" + (message.side === "self" ? " is-self" : "");
      if (message.side !== "self") {
        var avatar = document.createElement("span");
        avatar.className = "manager-avatar";
        avatar.textContent = "M";
        row.appendChild(avatar);
      }
      var bubble = document.createElement("div");
      bubble.className = "manager-chat-bubble";
      var text = document.createElement("p");
      var time = document.createElement("time");
      text.textContent = message.text;
      time.textContent = message.time || formatShortDate(message.date);
      bubble.append(text, time);
      row.appendChild(bubble);
      log.appendChild(row);
    });
    window.setTimeout(function () { log.scrollTop = log.scrollHeight; }, 0);
  }

  function managerReply(type) {
    var replies = { received: "收到。", promise: "今天会完成。", adjust: "申请调整今日运动目标。" };
    if (type === "adjust") {
      openCallSheetEditor();
      return;
    }
    upsertManagerMessage({ id: managerMessageId(todayValue(), "reply-" + type), date: todayValue(), side: "self", time: "刚刚", text: replies[type] });
    saveSettings();
    renderManager();
    window.setTimeout(function () {
      upsertManagerMessage({ id: managerMessageId(todayValue(), "response-" + type), date: todayValue(), side: "manager", time: "刚刚", text: type === "promise" ? "好。你答应的是完成原定目标，不是临时加量。" : "好，完成后回来找我结算。" });
      saveSettings();
      renderManager();
      if (window.EveMotion) window.EveMotion.reveal(document.querySelector("#managerChatLog .manager-chat-row:last-child"));
    }, 380);
  }

  function fanStage() {
    if (state.outcome && state.outcome.type === "success") return { key: "debut", code: "DEBUT", title: "正式出道", copy: "第一批粉丝正在庆祝姐姐的正式出道。", label: "出道日" };
    var total = Math.max(1, daysBetween(state.profile.startDate, state.profile.debutDate));
    var elapsed = Math.max(0, daysBetween(state.profile.startDate, todayValue()));
    var ratio = elapsed / total;
    if (ratio < 0.25) return { key: "early", code: "STAGE 01", title: "新人发现期", copy: "第一批人刚刚刷到你的新人档案。", label: "训练初期" };
    if (ratio < 0.65) return { key: "middle", code: "STAGE 02", title: "稳定积累期", copy: "有人开始每天等姐姐的训练更新。", label: "训练中期" };
    return { key: "sprint", code: "STAGE 03", title: "出道冲刺期", copy: "元老粉正在等姐姐的第一次舞台。", label: "冲刺期" };
  }

  function fanStageRange(type) {
    var stage = fanStage().key;
    var ranges = FAN_STAGE_RANGES[stage] || FAN_STAGE_RANGES.early;
    return ranges[type] || FAN_STAGE_RANGES.early[type];
  }

  function fanCommentQuantity() {
    if (state.fans <= 0) return 0;
    if (state.fans < 500) return 2;
    if (state.fans < 1000) return 3;
    if (state.fans < 2500) return 4;
    if (state.fans < 5000) return seededRange(todayValue(), "comment-count", 5, 6);
    if (state.fans < 10000) return seededRange(todayValue(), "comment-count", 7, 8);
    if (state.fans < 20000) return seededRange(todayValue(), "comment-count", 9, 11);
    if (state.fans < 50000) return seededRange(todayValue(), "comment-count", 12, 15);
    return seededRange(todayValue(), "comment-count", 16, 20);
  }

  function latestPhotoRecord() {
    return dailyHistory.filter(function (record) { return Boolean(record.businessPhoto); }).sort(function (a, b) { return b.date.localeCompare(a.date); })[0] || null;
  }

  function communityPostText(record) {
    if (!record || !record.sealed) return "今天还在练习室。等收工后，再来交今天的训练日记。";
    var remaining = daysUntil(state.profile.debutDate);
    if (allCallTasksComplete(record)) return remaining > 0
      ? "今天的 " + taskTotalCount(record) + " 项训练作业全部交齐" + (record.businessPhoto ? "，也放了一张营业照" : "") + "。离第一次舞台还有 " + remaining + " 天，明天也会好好出现。"
      : "最后一份训练作业" + (record.businessPhoto ? "和营业照" : "") + "都交齐了。第一次舞台，我准备好了。";
    if (baseTasksComplete(record)) return remaining > 0
      ? "今天完成了 " + taskDoneCount(record) + " 项通告，已经达到今日要求。离第一次舞台还有 " + remaining + " 天，明天见。"
      : "最后一天完成了今日要求。现在去准备第一次舞台。";
    return "今天交了 " + taskDoneCount(record) + "/" + taskTotalCount(record) + " 项训练作业。没有把没完成的藏起来，明天会继续把节奏找回来。";
  }

  function renderFanCommunity() {
    var stage = fanStage();
    var pool = (state.behindStreak >= 3 ? FAN_COMMENTS.cold : FAN_COMMENTS[stage.key])
      .concat(FAN_CONTEXT_COMMENTS.general, FAN_CONTEXT_COMMENTS.training);
    var priorityPools = [];
    var commentContexts = [stage.key];
    if (todayRecord && todayRecord.businessPhoto) {
      pool = pool.concat(FAN_CONTEXT_COMMENTS.photo);
      priorityPools.push({ key: "photo", copies: FAN_CONTEXT_COMMENTS.photo });
      commentContexts.push("photo");
    }
    if (todayRecord && todayRecord.sealed && baseTasksComplete(todayRecord)) {
      pool = pool.concat(FAN_CONTEXT_COMMENTS.completed);
      priorityPools.push({ key: "completed", copies: FAN_CONTEXT_COMMENTS.completed });
      commentContexts.push("completed");
    }
    if (stage.key === "sprint" || stage.key === "debut") {
      pool = pool.concat(FAN_CONTEXT_COMMENTS.sprint);
      commentContexts.push("sprint");
    }
    var count = fanCommentQuantity();
    setText("fanStageCode", stage.code);
    setText("fanStageTitle", state.fans ? stage.title : "还没有人认识你");
    setText("fanStageCopy", state.fans ? stage.copy : "发出第一份训练档案，等第一个人来叫你姐姐。");
    document.querySelectorAll("[data-stage-label]").forEach(function (element) { element.textContent = stage.label; });
    setText("fanCommentCount", count);
    setText("communityPostCopy", communityPostText(todayRecord));
    setText("communityMediaScore", todayRecord ? taskDoneCount(todayRecord) + "/" + taskTotalCount(todayRecord) : "0/3");
    setText("communityMediaCountdown", "D-" + daysUntil(state.profile.debutDate));
    var photoRecord = latestPhotoRecord();
    var photo = document.getElementById("communityPhoto");
    var fallback = document.querySelector("#communityMedia > span");
    if (photoRecord) photo.src = photoRecord.businessPhoto;
    photo.hidden = !photoRecord;
    fallback.hidden = Boolean(photoRecord);
    var list = document.getElementById("fanCommentList");
    var prioritySelection = priorityPools.slice(0, count).map(function (context) {
      var index = seededRange(todayValue(), "comment-priority-" + context.key, 0, context.copies.length - 1);
      return context.copies[index];
    });
    var fillerSelection = seededShuffle(pool, todayValue(), "comment-copy-" + stage.key).filter(function (copy) {
      return !prioritySelection.includes(copy);
    }).slice(0, Math.max(0, count - prioritySelection.length));
    var commentSelection = seededShuffle(prioritySelection.concat(fillerSelection), todayValue(), "comment-order-" + stage.key);
    var nameSelection = seededShuffle(FAN_NAMES, todayValue(), "comment-names-" + stage.key).slice(0, count);
    document.body.dataset.fanCommentContexts = commentContexts.join(",");
    list.replaceChildren();
    for (var index = 0; index < count; index += 1) {
      var item = document.createElement("div");
      item.className = "fan-comment";
      if (FAN_CONTEXT_COMMENTS.photo.includes(commentSelection[index])) item.dataset.commentContext = "photo";
      else if (FAN_CONTEXT_COMMENTS.completed.includes(commentSelection[index])) item.dataset.commentContext = "completed";
      else if (FAN_CONTEXT_COMMENTS.sprint.includes(commentSelection[index])) item.dataset.commentContext = "sprint";
      else item.dataset.commentContext = "general";
      var avatar = document.createElement("span");
      avatar.className = "comment-avatar";
      avatar.textContent = nameSelection[index].charAt(0).toUpperCase();
      var copy = document.createElement("div");
      var name = document.createElement("strong");
      var text = document.createElement("p");
      var time = document.createElement("small");
      name.textContent = nameSelection[index];
      text.textContent = commentSelection[index];
      time.textContent = index === 0 ? "刚刚" : (index + 1) + " 分钟前";
      copy.append(name, text, time);
      item.append(avatar, copy);
      list.appendChild(item);
    }
    if (!count) {
      var empty = document.createElement("div");
      empty.className = "empty-list";
      var strong = document.createElement("strong");
      var text = document.createElement("span");
      strong.textContent = "评论区还是空的";
      text.textContent = "完成第一次晨间达标后，会出现第一批模拟评论。";
      empty.append(strong, text);
      list.appendChild(empty);
    }
  }

  function createSvgElement(name, attributes) {
    var element = document.createElementNS("http://www.w3.org/2000/svg", name);
    Object.keys(attributes || {}).forEach(function (key) { element.setAttribute(key, attributes[key]); });
    return element;
  }

  function renderLineChart(svgId, records, valueGetter, goalGetter, options) {
    var svg = document.getElementById(svgId);
    svg.replaceChildren();
    if (!records.length) return false;
    var width = 340;
    var height = options.height || 150;
    var left = 28;
    var right = 326;
    var top = 18;
    var bottom = height - 20;
    var values = records.map(valueGetter).filter(function (value) { return typeof value === "number" && !Number.isNaN(value); });
    if (goalGetter) values = values.concat(records.map(goalGetter).filter(function (value) { return typeof value === "number" && !Number.isNaN(value); }));
    var minimum = Math.min.apply(Math, values);
    var maximum = Math.max.apply(Math, values);
    if (minimum === maximum) {
      var singlePointSpread = options.decimals === 0 ? Math.max(10, Math.ceil(Math.abs(maximum) * 0.1 / 10) * 10) : 0.5;
      minimum -= singlePointSpread;
      maximum += singlePointSpread;
    }
    var padding = (maximum - minimum) * 0.14;
    minimum -= padding;
    maximum += padding;
    if (options.decimals === 0 && values.every(function (value) { return value >= 0; })) minimum = Math.max(0, minimum);
    for (var lineIndex = 0; lineIndex < 4; lineIndex += 1) {
      var yGrid = top + (bottom - top) * lineIndex / 3;
      svg.appendChild(createSvgElement("line", { x1: left, y1: yGrid, x2: right, y2: yGrid, class: "chart-grid-line" }));
      var label = createSvgElement("text", { x: 0, y: yGrid + 3, class: "chart-label" });
      label.textContent = (maximum - (maximum - minimum) * lineIndex / 3).toFixed(options.decimals || 0);
      svg.appendChild(label);
    }
    function xAt(index) {
      if (records.length === 1) return (left + right) / 2;
      return left + (right - left) * index / (records.length - 1);
    }
    function yAt(value) { return top + (maximum - value) / (maximum - minimum) * (bottom - top); }
    var actualPoints = records.map(function (record, index) { return xAt(index) + "," + yAt(valueGetter(record)); }).join(" ");
    svg.appendChild(createSvgElement("polyline", { points: actualPoints, class: options.lineClass || "chart-actual-line" }));
    if (goalGetter) {
      var goalPoints = records.map(function (record, index) { return xAt(index) + "," + yAt(goalGetter(record)); }).join(" ");
      svg.insertBefore(createSvgElement("polyline", { points: goalPoints, class: "chart-goal-line" }), svg.lastChild);
      if (records.length === 1) svg.appendChild(createSvgElement("circle", { cx: xAt(0), cy: yAt(goalGetter(records[0])), r: 8, class: "chart-goal-point" }));
    }
    var lastValue = valueGetter(records[records.length - 1]);
    svg.appendChild(createSvgElement("circle", { cx: xAt(records.length - 1), cy: yAt(lastValue), r: 5, class: "chart-point" }));
    var valueLabel = createSvgElement("text", { x: xAt(records.length - 1), y: Math.max(12, yAt(lastValue) - 11), class: "chart-value-label", "text-anchor": "middle" });
    valueLabel.textContent = Number(lastValue).toFixed(options.decimals || 0) + (options.unit || "");
    svg.appendChild(valueLabel);
    if (records.length === 1) {
      var todayLabel = createSvgElement("text", { x: xAt(0), y: height - 3, class: "chart-label", "text-anchor": "middle" });
      todayLabel.textContent = "今天";
      svg.appendChild(todayLabel);
    } else {
      var firstLabel = createSvgElement("text", { x: left, y: height - 3, class: "chart-label" });
      var lastLabel = createSvgElement("text", { x: right - 22, y: height - 3, class: "chart-label" });
      firstLabel.textContent = formatShortDate(records[0].date).replace("月", "/").replace("日", "");
      lastLabel.textContent = "今天";
      svg.append(firstLabel, lastLabel);
    }
    return true;
  }

  function renderStatusCalendar() {
    var calendar = document.getElementById("statusCalendar");
    calendar.replaceChildren();
    var recordMap = {};
    dailyHistory.forEach(function (record) { recordMap[record.date] = record; });
    for (var offset = 59; offset >= 0; offset -= 1) {
      var date = addDays(todayValue(), -offset);
      var record = recordMap[date];
      var dateObject = parseDate(date);
      var button = document.createElement("button");
      button.type = "button";
      button.className = "calendar-day" + (record ? " is-" + statusClass(record.weightStatus) : "");
      button.disabled = !record;
      if (record) button.dataset.historyDate = date;
      var day = document.createElement("strong");
      var month = document.createElement("small");
      day.textContent = dateObject.getDate();
      month.textContent = (dateObject.getMonth() + 1) + "月";
      button.append(day, month);
      calendar.appendChild(button);
    }
  }

  function renderProgress() {
    var allRecords = dailyHistory.filter(function (record) { return record.weightSubmitted; }).sort(function (a, b) { return a.date.localeCompare(b.date); });
    var records = allRecords.slice(-30);
    setText("archiveCount", allRecords.length + "/60");
    var hasWeightChart = renderLineChart("weightChart", records, function (record) { return Number(record.weight); }, function (record) { return record.plannedWeight ? plannedWeightValue(record) : Number(record.weight); }, { height: 172, decimals: 2, unit: "kg" });
    setHidden("weightChartEmpty", hasWeightChart);
    if (records.length) setText("weightTrendDelta", (Number(records[records.length - 1].weight) - Number(records[0].weight)).toFixed(1) + " kg");
    var fanRecords = records.filter(function (record) {
      return typeof record.fanTotalAfter === "number" && (record.eveningSettled || record.weightStatus !== "baseline");
    });
    var hasFanChart = renderLineChart("fanChart", fanRecords, function (record) { return Number(record.fanTotalAfter); }, null, { height: 150, decimals: 0, lineClass: "chart-fan-line" });
    setHidden("fanChartEmpty", hasFanChart);
    setText("fanTrendTotal", formatFans(state.fans));
    renderStatusCalendar();
  }

  function openHistory(record) {
    if (!record) return;
    currentHistoryRecord = record;
    setText("historyStatusBadge", STATUS_LABELS[record.weightStatus] || "未记录");
    setText("historyDateLabel", formatFullDate(record.date));
    setText("historyWeightSummary", Number(record.weight).toFixed(1) + "kg · " + statusCopy(record));
    setText("historyMorningFans", signedNumber(Number(record.morningFans || 0) + Number(record.longTermPenalty || 0)));
    setText("historyEveningFans", signedNumber(record.eveningFans || 0));
    document.getElementById("historyRecordDetails").hidden = true;
    setText("historyDetailToggle", "查看当日记录");
    var mealList = document.getElementById("historyMealList");
    mealList.replaceChildren();
    MEAL_KEYS.forEach(function (key) {
      var meal = record.meals[key];
      var row = document.createElement("div");
      row.className = "history-meal-row";
      var visual;
      if (meal.photo) {
        visual = document.createElement("img");
        visual.src = meal.photo;
        visual.alt = MEAL_LABELS[key] + "照片";
      } else {
        visual = document.createElement("span");
        visual.textContent = MEAL_LABELS[key].charAt(0);
      }
      var copy = document.createElement("div");
      var title = document.createElement("strong");
      var note = document.createElement("small");
      title.textContent = MEAL_LABELS[key];
      note.textContent = meal.logged ? meal.note + (meal.calories !== null ? " · " + meal.calories + "kcal" : "") : "未记录";
      copy.append(title, note);
      row.append(visual, copy);
      mealList.appendChild(row);
    });
    var workoutList = document.getElementById("historyWorkoutList");
    workoutList.replaceChildren();
    var goals = workoutGoals(record);
    if (!goals.length) {
      var workoutEmpty = document.createElement("p");
      workoutEmpty.textContent = "未记录运动";
      workoutList.appendChild(workoutEmpty);
    } else {
      goals.forEach(function (goal) {
        var workoutRow = document.createElement("div");
        workoutRow.className = "history-workout-row";
        var workoutTitle = document.createElement("strong");
        var workoutMinutes = document.createElement("small");
        workoutTitle.textContent = goal.type;
        workoutMinutes.textContent = Number(goal.completedMinutes || 0) + "/" + goal.minutes + " 分钟" + (Number(goal.completedMinutes || 0) >= Number(goal.minutes || 0) ? " · 完成" : "");
        workoutRow.append(workoutTitle, workoutMinutes);
        workoutList.appendChild(workoutRow);
      });
    }
    setText("historyWaterText", Number(record.waterMl || 0) + "/" + normalizeWaterGoal(record.waterGoalMl) + "ml · " + (waterMet(record) ? "已达标" : "未达标"));
    var measurements = measurementEntries(record);
    setHidden("historyMeasurementSection", !measurements.length);
    setText("historyMeasurementText", measurements.map(function (entry) { return entry.label + " " + entry.value + "cm"; }).join(" · "));
    var customTasks = callSheetTasks(record).filter(function (task) { return task.kind === "custom"; });
    setHidden("historyCustomTaskSection", !customTasks.length);
    var customList = document.getElementById("historyCustomTaskList");
    customList.replaceChildren();
    customTasks.forEach(function (task) {
      var row = document.createElement("p");
      row.textContent = (task.completed ? "已完成 · " : "未完成 · ") + task.label;
      customList.appendChild(row);
    });
    setHidden("historyPhotoSection", !record.businessPhoto);
    if (record.businessPhoto) document.getElementById("historyPhoto").src = record.businessPhoto;
    openSheet("historySheet");
  }

  function toggleHistoryDetails() {
    var details = document.getElementById("historyRecordDetails");
    details.hidden = !details.hidden;
    setText("historyDetailToggle", details.hidden ? "查看当日记录" : "收起当日记录");
  }

  function renderRewardWallet() {
    setText("rewardProgressLabel", state.rewardProgress + "/3");
    document.querySelectorAll("#rewardProgressDots i").forEach(function (dot, index) { dot.classList.toggle("is-filled", index < state.rewardProgress); });
    var wallet = document.getElementById("rewardWallet");
    wallet.replaceChildren();
    document.getElementById("rewardEmpty").hidden = state.rewards.length > 0;
    state.rewards.slice().reverse().forEach(function (reward) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "reward-item" + (reward.usedDate ? " is-used" : "");
      button.dataset.rewardId = reward.id;
      var icon = document.createElement("span");
      icon.innerHTML = '<i data-lucide="ice-cream-bowl"></i>';
      var copy = document.createElement("div");
      var small = document.createElement("small");
      var title = document.createElement("strong");
      var text = document.createElement("p");
      var status = document.createElement("b");
      small.textContent = "FOOD REWARD · " + formatShortDate(reward.unlockedDate);
      title.textContent = reward.food + "奖励券";
      text.textContent = reward.usedDate ? formatShortDate(reward.usedDate) + " 已使用" : "点击后可以使用一次";
      status.textContent = reward.usedDate ? "已使用" : "可使用";
      copy.append(small, title, text);
      button.append(icon, copy, status);
      wallet.appendChild(button);
    });
    refreshIcons();
  }

  function useReward(rewardId) {
    var reward = state.rewards.find(function (item) { return item.id === rewardId; });
    if (!reward || reward.usedDate) return;
    askConfirmation("使用这张奖励券？", "使用后会记录日期，并保留为已使用纪念。", "确认使用", function () {
      reward.usedDate = todayValue();
      saveSettings();
      closeConfirmation();
      renderRewardWallet();
      showToast(reward.food + "奖励券已使用");
    });
  }

  function renderAlbum() {
    var photos = dailyHistory.filter(function (record) { return Boolean(record.businessPhoto); }).sort(function (a, b) { return b.date.localeCompare(a.date); });
    var grid = document.getElementById("albumGrid");
    grid.replaceChildren();
    document.getElementById("albumEmpty").hidden = photos.length > 0;
    photos.forEach(function (record) {
      var item = document.createElement("button");
      item.type = "button";
      item.className = "album-item";
      item.dataset.albumDate = record.date;
      var image = document.createElement("img");
      var label = document.createElement("span");
      image.src = record.businessPhoto;
      image.alt = formatShortDate(record.date) + "营业照";
      label.textContent = formatShortDate(record.date) + " · " + signedNumber(record.photoFans || 0) + " 粉丝";
      item.append(image, label);
      grid.appendChild(item);
    });
  }

  function openHomeWeightEditor() {
    if (!todayRecord) return;
    if (todayRecord.date === state.profile.startDate) {
      openProfileEditor();
      window.setTimeout(function () {
        var input = document.getElementById("profileStartWeightInput");
        input.focus();
        input.select();
      }, 120);
      return;
    }
    if (todayRecord.sealed) {
      showToast("今天已经结算，体重记录已锁定");
      return;
    }
    prepareDailyCheckin(true);
  }

  function normalizedHeight(value) {
    var height = parseLocalizedNumber(value);
    if (height > 1.2 && height <= 2.2) height *= 100;
    return height;
  }

  function updateProfileHealthNote() {
    var height = normalizedHeight(document.getElementById("profileHeightInput").value);
    var weight = parseLocalizedNumber(document.getElementById("profileStartWeightInput").value);
    var note = document.getElementById("profileHealthNote");
    if (!Number.isFinite(height) || height < 120 || height > 220 || !Number.isFinite(weight)) {
      note.hidden = true;
      return;
    }
    var reminderTarget = state.profile.mode === "maintenance" ? weight : state.profile.targetWeight;
    var notice = getWeightSafetyNotice(height, weight, reminderTarget);
    if (state.profile.mode === "maintenance" && notice && notice.blocked) {
      notice = {
        title: "你现在已经非常轻了",
        detail: "建议保持当前体重，不要再继续减重。"
      };
    }
    note.hidden = !notice;
    if (notice) note.querySelector("span").textContent = notice.title + "。" + notice.detail;
  }

  function openProfileEditor() {
    pendingAvatar = state.profile.avatar || "";
    document.getElementById("profileNameInput").value = state.profile.name || "";
    document.getElementById("profileHeightInput").value = Number(state.profile.height || 0).toFixed(1).replace(/\.0$/, "");
    document.getElementById("profileStartWeightInput").value = Number(state.profile.startWeight || 0).toFixed(1);
    document.getElementById("profileStartWeightInput").disabled = false;
    setText("profileWeightLockNote", "用于纠正建档时填错的数据；每日体重请在今日页修改。");
    [1, 2, 3].forEach(function (index) {
      document.getElementById("favoriteFoodEditInput" + index).value = state.profile.favoriteFoods[index - 1] || "";
    });
    var preview = document.getElementById("avatarEditorImage");
    preview.src = pendingAvatar;
    preview.hidden = !pendingAvatar;
    document.getElementById("avatarEditorFallback").hidden = Boolean(pendingAvatar);
    document.getElementById("avatarEditorFallback").textContent = "";
    document.getElementById("removeAvatarButton").hidden = !pendingAvatar;
    setHidden("profileEditError", true);
    updateProfileHealthNote();
    openSheet("profileEditSheet");
  }

  async function saveProfileEditor() {
    var name = document.getElementById("profileNameInput").value.trim();
    var foods = collectFoodInputs("favoriteFoodEditInput");
    var height = normalizedHeight(document.getElementById("profileHeightInput").value);
    var startWeight = parseLocalizedNumber(document.getElementById("profileStartWeightInput").value);
    var heightChanged = Math.abs(height - Number(state.profile.height)) > 0.001;
    var weightChanged = Math.abs(startWeight - Number(state.profile.startWeight)) > 0.001;
    if (!name || !foods.length) {
      setText("profileEditError", "请保留艺名和至少一种喜欢的食物。");
      setHidden("profileEditError", false);
      return;
    }
    if (!Number.isFinite(height) || height < 120 || height > 220) {
      setText("profileEditError", "身高请填写 120～220cm；也可以填写 1.65m。");
      setHidden("profileEditError", false);
      return;
    }
    if (!Number.isFinite(startWeight) || startWeight < 30 || startWeight > 250) {
      setText("profileEditError", "初始体重格式不正确，请按 kg 填写。");
      setHidden("profileEditError", false);
      return;
    }
    var evaluation = null;
    if (heightChanged || weightChanged) {
      if (state.profile.mode === "maintenance") {
        var maintenanceReminder = getWeightSafetyNotice(height, startWeight, startWeight);
        evaluation = {
          valid: true,
          blocked: false,
          lowBmi: Boolean(maintenanceReminder)
        };
      } else {
        evaluation = evaluateTarget(height, startWeight, state.profile.targetWeight, state.profile.debutDate);
      }
      if (!evaluation.valid || evaluation.blocked) {
        setText("profileEditError", "修改后与当前目标不匹配：" + evaluation.detail);
        setHidden("profileEditError", false);
        return;
      }
    }
    state.profile.name = name;
    state.profile.favoriteFoods = foods;
    state.profile.avatar = pendingAvatar;
    state.profile.height = Math.round(height * 10) / 10;
    if (weightChanged) {
      state.profile.startWeight = Math.round(startWeight * 10) / 10;
      if (state.profile.mode === "maintenance") state.profile.maintenanceCenter = state.profile.startWeight;
      var baselineRecord = dailyHistory.find(function (record) { return record.date === state.profile.startDate; });
      if (baselineRecord) {
        baselineRecord.weight = state.profile.startWeight;
        baselineRecord.previousWeight = state.profile.startWeight;
        baselineRecord.plannedWeight = state.profile.startWeight;
        baselineRecord.weightStatus = "baseline";
        if (todayRecord && todayRecord.date === baselineRecord.date) todayRecord = baselineRecord;
        await saveRecord(baselineRecord);
      }
    }
    saveSettings();
    closeSheet("profileEditSheet");
    renderAll();
    showToast(evaluation && evaluation.lowBmi ? "档案已更新；现在已经很轻，建议保持即可" : heightChanged || weightChanged ? "身高体重已纠正" : "新人档案已更新");
  }

  function openPlanEditor() {
    if (state.outcome && state.outcome.type !== "extension") {
      showOutcome();
      return;
    }
    document.getElementById("editTargetWeight").value = Number(state.profile.targetWeight).toFixed(1);
    document.getElementById("editDebutDate").value = state.profile.debutDate;
    document.getElementById("editDebutDate").min = addDays(todayValue(), 1);
    var repairingTarget = Boolean(state.profile.needsTargetRepair);
    document.getElementById("editTargetWeight").disabled = state.plan.targetEditUsed && !repairingTarget;
    document.getElementById("editDebutDate").disabled = state.plan.dateEditUsed;
    setText("targetEditState", repairingTarget ? "修复旧目标 · 不计次数" : state.plan.targetEditUsed ? "已用完" : "可修改 1 次");
    setText("dateEditState", state.plan.dateEditUsed ? "已用完" : "可修改 1 次");
    setHidden("planEditError", true);
    updatePlanEditPreview();
    openSheet("planEditSheet");
  }

  function promptLegacyTargetRepair() {
    if (!state.profile.needsTargetRepair || legacyRepairPrompted) return;
    legacyRepairPrompted = true;
    window.setTimeout(function () {
      openPlanEditor();
      showToast("旧版未保留原目标，请重新填写一次");
    }, 420);
  }

  function updatePlanEditPreview() {
    var target = Number(document.getElementById("editTargetWeight").value);
    var date = document.getElementById("editDebutDate").value;
    var evaluation = evaluateTarget(state.profile.height, currentWeight(), target, date);
    renderPaceCheck("editPaceCheck", evaluation);
  }

  function savePlanEdits() {
    var target = Number(document.getElementById("editTargetWeight").value);
    var date = document.getElementById("editDebutDate").value;
    var repairingTarget = Boolean(state.profile.needsTargetRepair);
    var targetChanged = Math.abs(target - Number(state.profile.targetWeight)) > 0.001;
    var dateChanged = date !== state.profile.debutDate;
    if (!targetChanged && !dateChanged) {
      closeSheet("planEditSheet");
      return;
    }
    if ((targetChanged && state.plan.targetEditUsed && !repairingTarget) || (dateChanged && state.plan.dateEditUsed)) {
      setText("planEditError", "这项修改次数已经用完。");
      setHidden("planEditError", false);
      return;
    }
    var evaluation = evaluateTarget(state.profile.height, currentWeight(), target, date);
    if (!evaluation.valid || evaluation.blocked) {
      setText("planEditError", evaluation.detail);
      setHidden("planEditError", false);
      return;
    }
    askConfirmation(repairingTarget ? "确认修复目标？" : "确认最后一次修改？", repairingTarget ? "保存后会按这个体重重新计算未来每日目标，本次不消耗修改机会。" : "保存后，本次修改的项目将无法再次更改；过去结果不会重算。", "确认修改", function () {
      if (targetChanged) {
        state.profile.targetWeight = evaluation.mode === "maintenance" ? currentWeight() : target;
        state.profile.mode = evaluation.mode;
        state.profile.maintenanceCenter = evaluation.mode === "maintenance" ? currentWeight() : null;
        state.profile.needsTargetRepair = false;
        state.plan.targetEditUsed = repairingTarget ? false : true;
      }
      if (dateChanged) {
        state.profile.debutDate = date;
        state.plan.dateEditUsed = true;
      }
      saveSettings();
      closeConfirmation();
      closeSheet("planEditSheet");
      renderAll();
      showToast("未来目标线已重新计算");
    });
  }

  function renderPastPlans() {
    var section = document.getElementById("pastPlansSection");
    var list = document.getElementById("pastPlansList");
    section.hidden = !state.pastPlans.length;
    list.replaceChildren();
    state.pastPlans.slice().reverse().forEach(function (plan) {
      var row = document.createElement("div");
      row.className = "past-plan-row";
      var copy = document.createElement("div");
      var title = document.createElement("strong");
      var detail = document.createElement("small");
      var result = document.createElement("strong");
      title.textContent = plan.name + " · " + formatShortDate(plan.endDate);
      detail.textContent = plan.startWeight.toFixed(1) + "kg → " + plan.finalWeight.toFixed(1) + "kg · " + plan.completion + "%";
      result.textContent = plan.label;
      copy.append(title, detail);
      row.append(copy, result);
      list.appendChild(row);
    });
  }

  function completionRatio() {
    if (state.profile.mode === "maintenance") return Math.abs(currentWeight() - Number(state.profile.maintenanceCenter)) <= 0.5 ? 1 : 0;
    var total = Number(state.profile.startWeight) - Number(state.profile.targetWeight);
    return total > 0 ? (Number(state.profile.startWeight) - currentWeight()) / total : 0;
  }

  async function maybeShowOutcome() {
    if (!state.trainingStarted || state.plan.status !== "active" || state.outcome || daysUntil(state.profile.debutDate) > 0 || !todayRecord || !todayRecord.weightSubmitted) return false;
    var ratio = completionRatio();
    var type = ratio >= 1 ? "success" : ratio >= 0.8 ? "extension" : "stopped";
    var fanDelta = type === "success" ? seededRange(todayValue(), "outcome-success", 5000, 12000) : type === "stopped" ? -seededRange(todayValue(), "outcome-stopped", 2000, 5000) : 0;
    state.fans = Math.max(0, state.fans + fanDelta);
    state.outcome = { type: type, date: todayValue(), completion: Math.max(0, Math.round(ratio * 100)), fanDelta: fanDelta, finalWeight: currentWeight() };
    state.plan.status = type === "extension" ? "extension" : "complete";
    saveSettings();
    showOutcome();
    return true;
  }

  function outcomeLabels(type) {
    if (type === "success") return { code: "DEBUT", eyebrow: "ROOKIE PROJECT COMPLETE", title: "正式出道", copy: "目标已经达成。第一轮新人训练正式结束。", button: "查看最终档案" };
    if (type === "extension") return { code: "DELAY", eyebrow: "SCHEDULE UPDATE", title: "延期出道", copy: "已完成目标的 80% 以上。选择 3～14 天继续完成最后阶段。", button: "确认延期" };
    return { code: "STOP", eyebrow: "PROJECT CLOSED", title: "计划中止", copy: "本轮完成度不足 80%，档案会保留，之后可以重新开启新人计划。", button: "查看本轮档案" };
  }

  function showOutcome() {
    if (!state.outcome) return;
    var labels = outcomeLabels(state.outcome.type);
    document.getElementById("mainApp").hidden = true;
    document.getElementById("dailyCheckin").hidden = true;
    document.getElementById("outcomeScreen").hidden = false;
    setText("outcomeCode", labels.code);
    setText("outcomeEyebrow", labels.eyebrow);
    setText("outcomeTitle", labels.title);
    setText("outcomeCopy", labels.copy);
    setText("outcomeStartWeight", Number(state.profile.startWeight).toFixed(1) + "kg");
    setText("outcomeFinalWeight", Number(state.outcome.finalWeight).toFixed(1) + "kg");
    setText("outcomeCompletion", state.outcome.completion + "%");
    setText("outcomeFans", signedNumber(state.outcome.fanDelta) + " FANS");
    setText("outcomePrimaryButton", labels.button);
    document.getElementById("extensionPicker").hidden = state.outcome.type !== "extension";
    document.getElementById("restartPlanButton").hidden = state.outcome.type === "extension";
    refreshIcons();
    if (window.EveMotion) window.EveMotion.outcome(document.getElementById("outcomeScreen"));
  }

  function handleOutcomePrimary() {
    if (!state.outcome) return;
    if (state.outcome.type === "extension") {
      var days = Number(document.getElementById("extensionDays").value || 7);
      state.profile.debutDate = addDays(todayValue(), days);
      state.plan.status = "active";
      state.plan.extensionCount += 1;
      state.outcome = null;
      saveSettings();
      showMainApp("today");
      showToast("出道日已延期 " + days + " 天");
      return;
    }
    document.getElementById("outcomeScreen").hidden = true;
    showMainApp("profile");
  }

  async function restartPlan() {
    askConfirmation("重新开启新人计划？", "旧计划只保留结局摘要，逐日记录和照片会被清除。", "重新开始", async function () {
      var summary = {
        name: state.profile.name,
        endDate: state.outcome ? state.outcome.date : todayValue(),
        startWeight: Number(state.profile.startWeight),
        finalWeight: currentWeight(),
        completion: state.outcome ? state.outcome.completion : progressPercent(),
        fans: state.fans,
        label: state.outcome && state.outcome.type === "success" ? "正式出道" : "计划中止"
      };
      var pastPlans = state.pastPlans.concat(summary).slice(-8);
      if (window.EveDailyStore) {
        try { await window.EveDailyStore.clear(); } catch (error) { storageAvailable = false; }
      }
      window.localStorage.removeItem(BACKUP_KEY);
      state = createDefaultState();
      state.pastPlans = pastPlans;
      dailyHistory = [];
      todayRecord = null;
      pendingAvatar = "";
      saveSettings();
      closeConfirmation();
      startOnboarding();
    });
  }

  function setWorkoutMenuOpen(picker, open) {
    if (!picker) return;
    var input = picker.querySelector('input[role="combobox"]');
    var menu = picker.querySelector(".editable-select__menu");
    picker.classList.toggle("is-open", open);
    menu.hidden = !open;
    input.setAttribute("aria-expanded", String(open));
    if (open) {
      var viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      var nav = document.querySelector(".bottom-nav");
      var navHeight = nav && !nav.hidden ? nav.offsetHeight : 0;
      var pickerBox = picker.getBoundingClientRect();
      var menuHeight = Math.min(230, WORKOUT_SUGGESTIONS.length * 40 + 2);
      var spaceBelow = viewportHeight - pickerBox.bottom - navHeight - 8;
      var spaceAbove = pickerBox.top - 8;
      var insideSheet = Boolean(picker.closest(".bottom-sheet"));
      picker.classList.toggle("opens-up", !insideSheet && spaceBelow < menuHeight && spaceAbove > spaceBelow);
      menu.querySelectorAll("[data-workout-option]").forEach(function (option) {
        var selected = option.dataset.workoutOption === input.value.trim();
        option.classList.toggle("is-selected", selected);
        option.setAttribute("aria-selected", String(selected));
      });
    } else {
      picker.classList.remove("opens-up");
    }
  }

  function closeWorkoutMenus(except) {
    document.querySelectorAll("[data-workout-picker]").forEach(function (picker) {
      if (picker !== except) setWorkoutMenuOpen(picker, false);
    });
  }

  function setupWorkoutPickers() {
    document.querySelectorAll("[data-workout-picker]").forEach(function (picker) {
      var input = picker.querySelector('input[role="combobox"]');
      var toggle = picker.querySelector(".editable-select__toggle");
      var menu = picker.querySelector(".editable-select__menu");
      WORKOUT_SUGGESTIONS.forEach(function (name) {
        var option = document.createElement("button");
        option.type = "button";
        option.setAttribute("role", "option");
        option.dataset.workoutOption = name;
        option.textContent = name;
        option.addEventListener("click", function () {
          input.value = name;
          input.dispatchEvent(new Event("input", { bubbles: true }));
          setWorkoutMenuOpen(picker, false);
          input.focus();
        });
        menu.appendChild(option);
      });
      toggle.addEventListener("click", function () {
        var willOpen = menu.hidden;
        closeWorkoutMenus(picker);
        setWorkoutMenuOpen(picker, willOpen);
      });
      input.addEventListener("keydown", function (event) {
        if (event.key === "ArrowDown") setWorkoutMenuOpen(picker, true);
        if (event.key === "Escape") setWorkoutMenuOpen(picker, false);
      });
    });
    document.addEventListener("click", function (event) {
      if (!event.target.closest("[data-workout-picker]")) closeWorkoutMenus();
    });
  }

  function bindStaticEvents() {
    setupWorkoutPickers();
    document.getElementById("introContinueButton").addEventListener("click", showProfileSetup);
    document.getElementById("onboardingImportButton").addEventListener("click", function () { document.getElementById("dataImportInput").click(); });
    document.getElementById("editHomeWeightButton").addEventListener("click", openHomeWeightEditor);
    document.getElementById("backToIntroButton").addEventListener("click", backToIntro);
    document.getElementById("backToProfileSetupButton").addEventListener("click", backToProfileSetup);
    document.getElementById("profileContinueButton").addEventListener("click", submitProfileSetup);
    ["onboardingNameInput", "onboardingHeightInput", "onboardingWeightInput", "onboardingFoodInput1", "onboardingFoodInput2", "onboardingFoodInput3"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", clearProfileSetupErrors);
    });
    document.getElementById("objectDateButton").addEventListener("click", function () {
      document.getElementById("debutDateField").hidden = false;
      document.getElementById("objectDateButton").hidden = true;
      scrollThreadToBottom();
    });
    document.getElementById("debutDateInput").addEventListener("change", updateOnboardingTargetPreview);
    document.getElementById("targetWeightInput").addEventListener("input", updateOnboardingTargetPreview);
    document.getElementById("confirmTargetButton").addEventListener("click", confirmOnboardingTarget);
    document.getElementById("openProfileButton").addEventListener("click", openProfileAfterOnboarding);
    document.getElementById("enterTodayButton").addEventListener("click", enterTodayFromProfile);
    document.getElementById("tutorialStartButton").addEventListener("click", completeFirstDayTutorial);
    document.getElementById("tutorialSkipButton").addEventListener("click", completeFirstDayTutorial);
    document.getElementById("tutorialScrim").addEventListener("click", completeFirstDayTutorial);

    document.getElementById("onboardingAvatarButton").addEventListener("click", function () { document.getElementById("onboardingAvatarInput").click(); });
    document.getElementById("onboardingAvatarInput").addEventListener("change", async function (event) {
      try {
        pendingAvatar = await imageFileToDataUrl(event.target.files[0], 480, 600, 0.82);
        document.getElementById("onboardingAvatarPreview").src = pendingAvatar;
        document.getElementById("onboardingAvatarPreview").hidden = false;
        document.getElementById("onboardingAvatarFallback").hidden = true;
      } catch (error) { showToast("请选择有效图片"); }
      event.target.value = "";
    });

    document.querySelectorAll("[data-view-target]").forEach(function (button) {
      button.addEventListener("click", function () { setActiveView(button.dataset.viewTarget); });
    });
    document.getElementById("callSheetList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-task-jump]");
      if (button) {
        setActiveView("record");
        var targets = { meals: "mealRecordBlock", workout: "workoutRecordBlock", water: "waterRecordBlock", measurements: "measurementRecordBlock", custom: "customTaskRecordBlock" };
        var target = targets[button.dataset.taskJump] || "recordTitle";
        window.setTimeout(function () { document.getElementById(target).scrollIntoView({ behavior: "smooth", block: "start" }); }, 180);
      }
    });

    document.getElementById("dailyWeightMinus").addEventListener("click", function () { adjustDailyWeight(-0.1); });
    document.getElementById("dailyWeightPlus").addEventListener("click", function () { adjustDailyWeight(0.1); });
    document.getElementById("submitDailyWeightButton").addEventListener("click", submitDailyWeight);
    document.getElementById("enterWorkspaceButton").addEventListener("click", enterWorkspaceAfterMorning);
    document.getElementById("editTodayWeightButton").addEventListener("click", function () { prepareDailyCheckin(true); });

    document.querySelectorAll("[data-meal]").forEach(function (button) { button.addEventListener("click", function () { openMealSheet(button.dataset.meal); }); });
    document.getElementById("mealSheetScrim").addEventListener("click", function () { closeSheet("mealSheet"); });
    document.getElementById("closeMealSheetButton").addEventListener("click", function () { closeSheet("mealSheet"); });
    document.getElementById("mealNoteInput").addEventListener("input", function (event) { setText("mealNoteCount", event.target.value.length); setHidden("mealSheetError", true); });
    document.getElementById("mealCaloriesInput").addEventListener("input", function () { setHidden("mealSheetError", true); });
    document.getElementById("mealPhotoButton").addEventListener("click", function () { document.getElementById("mealPhotoInput").click(); });
    document.getElementById("mealPhotoInput").addEventListener("change", async function (event) {
      try {
        pendingMealPhoto = await imageFileToDataUrl(event.target.files[0], 900, 1100, 0.76);
        document.getElementById("mealPhotoPreview").src = pendingMealPhoto;
        document.getElementById("mealPhotoPreview").hidden = false;
        document.getElementById("mealPhotoEmpty").hidden = true;
        document.getElementById("removeMealPhotoButton").hidden = false;
      } catch (error) { showToast("请选择有效图片"); }
      event.target.value = "";
    });
    document.getElementById("removeMealPhotoButton").addEventListener("click", function () {
      pendingMealPhoto = "";
      document.getElementById("mealPhotoPreview").hidden = true;
      document.getElementById("mealPhotoEmpty").hidden = false;
      document.getElementById("removeMealPhotoButton").hidden = true;
    });
    document.getElementById("saveMealButton").addEventListener("click", saveMeal);
    document.getElementById("deleteMealButton").addEventListener("click", deleteMeal);

    document.getElementById("editWorkoutPlanButton").addEventListener("click", openWorkoutPlanSheet);
    document.getElementById("workoutPlanScrim").addEventListener("click", function () { closeSheet("workoutPlanSheet"); });
    document.getElementById("closeWorkoutPlanButton").addEventListener("click", function () { closeSheet("workoutPlanSheet"); });
    document.getElementById("addWorkoutGoalButton").addEventListener("click", function () { addWorkoutGoalToDraft(false); });
    document.getElementById("workoutGoalPlanList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-workout-plan-delete]");
      if (button) removeWorkoutGoalFromDraft(button.dataset.workoutPlanDelete);
    });
    document.getElementById("saveWorkoutPlanButton").addEventListener("click", saveWorkoutPlan);
    document.getElementById("workoutEntryList").addEventListener("click", function (event) {
      var checkButton = event.target.closest("[data-workout-goal-check]");
      var saveButton = event.target.closest("[data-workout-goal-save]");
      if (checkButton) toggleWorkoutGoal(checkButton.dataset.workoutGoalCheck);
      if (saveButton) savePartialWorkoutGoal(saveButton.dataset.workoutGoalSave);
    });
    document.querySelectorAll("[data-water-add]").forEach(function (button) {
      button.addEventListener("click", function () { addWater(Number(button.dataset.waterAdd)); });
    });
    document.getElementById("saveWaterButton").addEventListener("click", saveWaterFromInput);
    document.getElementById("editWaterGoalButton").addEventListener("click", openWaterGoalEditor);
    document.getElementById("waterGoalScrim").addEventListener("click", function () { closeSheet("waterGoalSheet"); });
    document.getElementById("closeWaterGoalButton").addEventListener("click", function () { closeSheet("waterGoalSheet"); });
    document.getElementById("waterGoalInput").addEventListener("input", function () { setHidden("waterGoalError", true); });
    document.getElementById("saveWaterGoalButton").addEventListener("click", saveWaterGoal);

    document.getElementById("editCallSheetButton").addEventListener("click", openCallSheetEditor);
    document.getElementById("callSheetEditorScrim").addEventListener("click", function () { closeSheet("callSheetEditor"); });
    document.getElementById("closeCallSheetEditorButton").addEventListener("click", function () { closeSheet("callSheetEditor"); });
    document.getElementById("callSheetBuiltinOptions").addEventListener("click", function (event) {
      var button = event.target.closest("[data-call-sheet-builtin]");
      if (button) toggleCallSheetBuiltin(button.dataset.callSheetBuiltin);
    });
    document.getElementById("customCallSheetDraftList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-call-sheet-custom-remove]");
      if (button) removeCustomCallSheetTask(button.dataset.callSheetCustomRemove);
    });
    document.getElementById("addCustomCallSheetButton").addEventListener("click", addCustomCallSheetTask);
    document.getElementById("customCallSheetInput").addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); addCustomCallSheetTask(); }
    });
    document.getElementById("saveCallSheetButton").addEventListener("click", saveCallSheet);

    document.getElementById("saveMeasurementsButton").addEventListener("click", saveMeasurements);
    ["waistInput", "thighInput", "calfInput", "bustInput", "otherMeasurementName", "otherMeasurementValue"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", function () { setHidden("measurementError", true); });
    });
    document.getElementById("customTaskRecordList").addEventListener("click", function (event) {
      var button = event.target.closest("[data-custom-task-check]");
      if (button) toggleCustomTask(button.dataset.customTaskCheck);
    });

    document.getElementById("businessPhotoButton").addEventListener("click", function () { document.getElementById("businessPhotoInput").click(); });
    document.getElementById("businessPhotoInput").addEventListener("change", async function (event) {
      try {
        pendingBusinessPhoto = await imageFileToDataUrl(event.target.files[0], 900, 1200, 0.78);
        await setBusinessPhoto(pendingBusinessPhoto);
      } catch (error) { showToast("请选择有效图片"); }
      event.target.value = "";
    });
    document.getElementById("removeBusinessPhotoButton").addEventListener("click", function () { setBusinessPhoto(""); });

    document.getElementById("finishDayButton").addEventListener("click", openSettlementSheet);
    document.getElementById("settlementScrim").addEventListener("click", function () { closeSheet("settlementSheet"); });
    document.getElementById("closeSettlementButton").addEventListener("click", function () { closeSheet("settlementSheet"); });
    document.getElementById("confirmSettlementButton").addEventListener("click", confirmEveningSettlement);
    document.getElementById("fanGrowthScrim").addEventListener("click", function () { closeSheet("fanGrowthSheet"); });
    document.getElementById("closeFanGrowthButton").addEventListener("click", function () { closeSheet("fanGrowthSheet"); });
    document.getElementById("laterFanCommentsButton").addEventListener("click", function () { closeSheet("fanGrowthSheet"); });
    document.getElementById("viewFanCommentsButton").addEventListener("click", viewFanComments);
    document.getElementById("exportAfterSettlementButton").addEventListener("click", exportDataArchive);

    document.querySelectorAll("[data-manager-reply]").forEach(function (button) { button.addEventListener("click", function () { managerReply(button.dataset.managerReply); }); });
    document.getElementById("streakButton").addEventListener("click", function () { showToast("连续达标 " + state.streak + " 天"); });

    document.getElementById("editProfileButton").addEventListener("click", openProfileEditor);
    document.getElementById("profileAvatarButton").addEventListener("click", openProfileEditor);
    document.getElementById("profileEditScrim").addEventListener("click", function () { closeSheet("profileEditSheet"); });
    document.getElementById("closeProfileEditButton").addEventListener("click", function () { closeSheet("profileEditSheet"); });
    document.getElementById("avatarEditorButton").addEventListener("click", function () { document.getElementById("avatarFileInput").click(); });
    document.getElementById("avatarFileInput").addEventListener("change", async function (event) {
      try {
        pendingAvatar = await imageFileToDataUrl(event.target.files[0], 480, 600, 0.82);
        document.getElementById("avatarEditorImage").src = pendingAvatar;
        document.getElementById("avatarEditorImage").hidden = false;
        document.getElementById("avatarEditorFallback").hidden = true;
        document.getElementById("removeAvatarButton").hidden = false;
      } catch (error) { showToast("请选择有效图片"); }
      event.target.value = "";
    });
    document.getElementById("removeAvatarButton").addEventListener("click", function () {
      pendingAvatar = "";
      document.getElementById("avatarEditorImage").hidden = true;
      document.getElementById("avatarEditorFallback").hidden = false;
      document.getElementById("removeAvatarButton").hidden = true;
    });
    document.getElementById("saveProfileEditButton").addEventListener("click", saveProfileEditor);
    ["profileHeightInput", "profileStartWeightInput"].forEach(function (id) {
      document.getElementById(id).addEventListener("input", function () {
        setHidden("profileEditError", true);
        updateProfileHealthNote();
      });
    });
    document.querySelectorAll("[data-profile-action]").forEach(function (button) {
      button.addEventListener("click", function () {
        var action = button.dataset.profileAction;
        if (action === "plan") openPlanEditor();
        if (action === "rewards") { renderRewardWallet(); openSheet("rewardSheet"); }
        if (action === "album") { renderAlbum(); openSheet("albumSheet"); }
        if (action === "manager") setActiveView("manager");
        if (action === "data") openDataBackupSheet();
      });
    });
    document.getElementById("dataSheetScrim").addEventListener("click", function () { closeSheet("dataSheet"); });
    document.getElementById("closeDataSheetButton").addEventListener("click", function () { closeSheet("dataSheet"); });
    document.getElementById("exportDataButton").addEventListener("click", exportDataArchive);
    document.getElementById("downloadDataButton").addEventListener("click", function () { exportDataArchive(true); });
    document.getElementById("importDataButton").addEventListener("click", function () { document.getElementById("dataImportInput").click(); });
    document.getElementById("dataImportInput").addEventListener("change", function (event) {
      var file = event.target.files && event.target.files[0];
      event.target.value = "";
      handleDataImport(file);
    });
    document.getElementById("planEditScrim").addEventListener("click", function () { closeSheet("planEditSheet"); });
    document.getElementById("closePlanEditButton").addEventListener("click", function () { closeSheet("planEditSheet"); });
    document.getElementById("editTargetWeight").addEventListener("input", updatePlanEditPreview);
    document.getElementById("editDebutDate").addEventListener("change", updatePlanEditPreview);
    document.getElementById("savePlanEditButton").addEventListener("click", savePlanEdits);

    document.getElementById("rewardSheetScrim").addEventListener("click", function () { closeSheet("rewardSheet"); });
    document.getElementById("closeRewardSheetButton").addEventListener("click", function () { closeSheet("rewardSheet"); });
    document.getElementById("rewardWallet").addEventListener("click", function (event) {
      var button = event.target.closest("[data-reward-id]");
      if (button) useReward(button.dataset.rewardId);
    });
    document.getElementById("albumScrim").addEventListener("click", function () { closeSheet("albumSheet"); });
    document.getElementById("closeAlbumButton").addEventListener("click", function () { closeSheet("albumSheet"); });
    document.getElementById("albumGrid").addEventListener("click", function (event) {
      var button = event.target.closest("[data-album-date]");
      if (!button) return;
      var record = dailyHistory.find(function (item) { return item.date === button.dataset.albumDate; });
      closeSheet("albumSheet");
      window.setTimeout(function () { openHistory(record); }, 180);
    });

    document.getElementById("statusCalendar").addEventListener("click", function (event) {
      var button = event.target.closest("[data-history-date]");
      if (!button) return;
      openHistory(dailyHistory.find(function (record) { return record.date === button.dataset.historyDate; }));
    });
    document.getElementById("historyScrim").addEventListener("click", function () { closeSheet("historySheet"); });
    document.getElementById("closeHistoryButton").addEventListener("click", function () { closeSheet("historySheet"); });
    document.getElementById("historyDetailToggle").addEventListener("click", toggleHistoryDetails);

    document.getElementById("confirmScrim").addEventListener("click", closeConfirmation);
    document.getElementById("confirmCancelButton").addEventListener("click", closeConfirmation);
    document.getElementById("confirmActionButton").addEventListener("click", function () { if (confirmHandler) confirmHandler(); });
    document.getElementById("outcomePrimaryButton").addEventListener("click", handleOutcomePrimary);
    document.getElementById("restartPlanButton").addEventListener("click", restartPlan);

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", function () {
        document.documentElement.style.setProperty("--visual-height", window.visualViewport.height + "px");
      });
    }
  }

  async function resetExperienceIfRequested() {
    var params = new URLSearchParams(window.location.search);
    var resetFromHash = window.location.hash === "#reset";
    if (params.get("reset") !== "1" && !resetFromHash) return false;
    window.localStorage.removeItem(SETTINGS_KEY);
    window.localStorage.removeItem(BACKUP_KEY);
    window.localStorage.removeItem("__eve_test_day_offset");
    try {
      await window.EveDailyStore.open();
      await window.EveDailyStore.clear();
      storageAvailable = true;
    } catch (error) {
      storageAvailable = false;
    }
    state = createDefaultState();
    dailyHistory = [];
    todayRecord = null;
    pendingMealPhoto = "";
    pendingAvatar = "";
    pendingBusinessPhoto = "";
    onboardingDraft = null;
    try {
      params.delete("reset");
      var cleanHash = resetFromHash ? "" : window.location.hash;
      var cleanUrl = window.location.pathname + (params.toString() ? "?" + params.toString() : "") + cleanHash;
      window.history.replaceState(null, "", cleanUrl);
    } catch (error) {}
    return true;
  }

  async function initialize() {
    var copyAudit = presetCopyAudit();
    bindStaticEvents();
    refreshIcons();
    document.body.dataset.managerMessageLibrarySize = String(managerMessageLibrarySize());
    document.body.dataset.presetCopyLibrarySize = String(copyAudit.total);
    document.body.dataset.presetCopyUnique = String(copyAudit.total === copyAudit.unique);
    document.body.dataset.fanSisterCopyCount = String(copyAudit.sisterTotal);
    document.body.dataset.fanNameLibrarySize = String(copyAudit.fanNameTotal);
    document.body.dataset.fanNamesUnique = String(copyAudit.fanNameTotal === copyAudit.uniqueFanNames);
    await resetExperienceIfRequested();
    if (!state.onboardingComplete) {
      startOnboarding();
      return;
    }
    await prepareDailyStorage();
    ensureDailyManagerMessage();
    document.getElementById("bootScreen").hidden = true;
    if (state.outcome && state.plan.status !== "active") {
      showOutcome();
      document.body.dataset.archiveReady = "true";
      return;
    }
    if (!state.trainingStarted) {
      openProfileAfterOnboarding();
      return;
    }
    if (todayRecord && !todayRecord.weightSubmitted) {
      prepareDailyCheckin(false);
      return;
    }
    showMainApp(state.activeView || "today");
    if (state.tutorialPending && !state.tutorialSeen) window.setTimeout(openFirstDayTutorial, 220);
    await maybeShowOutcome();
  }

  initialize().catch(function () {
    document.getElementById("bootScreen").hidden = true;
    showToast("本地档案读取失败，请重新打开");
  });
})();
