import { Box, Snackbar, Stack, Tab, Tabs, Typography, useTheme } from '@mui/material'
import { useWindowWidth } from '@react-hook/window-size'
import { getAuth } from 'firebase/auth'
import { doc, getDoc, getFirestore } from 'firebase/firestore'
import { DateTime } from 'luxon'
import { useEffect, useState } from 'react'
import { connect } from 'react-redux'
import firebase from '../../firebase-config'
import { FormattedGoal, GoalStatus } from '../../types/goal'
import LegacyGoal from '../../types/legacy-goal'
import LegacyWeight from '../../types/legacy-weight'
import ReduxProps from '../../types/redux-props'
import Weight from '../../types/weight'
import { calculateTodaysWeight } from '../../utils/calculate-todays-weight'
import { compareGoals } from '../../utils/compare-goals'
import { compareWeights } from '../../utils/compare-weights'
import { updateGoalStatuses } from '../../utils/determine-goal-status'
import determineLegacyGoalStatus from '../../utils/determine-legacy-goal-status'
import GoalNotifier from './GoalNotifier'
import Goals from './Goals'
import LineGraph from './LineGraph'
import RecentWeightLogs from './RecentWeightLogs'
import Settings from './Settings'
import WeightLogger from './WeightLogger'

enum DisplayOptions {
  History,
  Goals,
  Settings
}

const formattedGoalDate = (targetDate: string) => {
  // previously, dates were not already saved in ISO (bad decision)
  const forceToISO = new Date(targetDate).toISOString()
  return DateTime.fromISO(forceToISO).toLocaleString(DateTime.DATE_FULL)
}

const Dashboard = (props: ReduxProps) => {
  const [snackBarMessage, setSnackBarMessage] = useState('')
  const [sortedWeights, setSortedWeights] = useState<(Weight | LegacyWeight)[]>([])
  const [loaded, setLoaded] = useState(false) 
  const [upcomingGoal, setUpcomingGoal] = useState<FormattedGoal | LegacyGoal | null>(null)
  const [goals, setGoals] = useState<(LegacyGoal | FormattedGoal)[]>([])
  const [tabValue, setTabValue] = useState(DisplayOptions.History)
  const theme = useTheme()
  const width = useWindowWidth()
  const auth = getAuth(firebase)

  const evaluateDashboardData = async () => {
    const db = getFirestore(firebase);
    const docRef = doc(db, 'users', props.uid);
    try {
      const docSnap = await getDoc(docRef);
      const weightHistory = docSnap.data()?.weights;
      const goalHistory: (FormattedGoal | LegacyGoal)[] = docSnap.data()?.goals?.length ? 
        docSnap.data()?.goals.map(goal => ({
          ...goal, 
          formattedGoalDate: formattedGoalDate(goal.goalTarget),
          status: goal.status ?? determineLegacyGoalStatus(goal)
        }))
      : [];
      
      if (weightHistory) {
        const sortedAllWeightsRecorded = weightHistory.sort(compareWeights)
        setSortedWeights(sortedAllWeightsRecorded)
      }

      setGoals(goalHistory.length ? goalHistory.sort(compareGoals) : goalHistory)

      if (goalHistory.length) {
        const upcomingGoal = goalHistory.sort(compareGoals).filter(goal => goal.status === GoalStatus.InProgress)[0]
        setUpcomingGoal(upcomingGoal)
      }

      try {
        const lastWeight = sortedWeights.length ? Number(sortedWeights[0].weight) : null
        if (lastWeight !== null) {
          const goalStatus = await updateGoalStatuses(goals, lastWeight, props.uid)
          if (goalStatus.updatedGoals) {
            setGoals(goalStatus.updatedGoals)
          }
        }
        
        setLoaded(true)
      } catch (error) {
        setSnackBarMessage('There was an error.')
        console.log(`Error: ${error}`) 
      }
    } catch(error) {
      setSnackBarMessage('There was an error.')
      console.log(`Error: ${error}`)
    }
  }

  useEffect(() => {
    evaluateDashboardData()
  }, [])

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const todaysWeight = calculateTodaysWeight(sortedWeights)

  return (
    <Stack 
      direction={width > 700 ? "row" : "column"}
      width={'100%'} 
      height={'100%'}>
      <Tabs
        orientation={width > 700 ? "vertical" : "horizontal"}
        variant="scrollable"
        value={tabValue}
        onChange={handleTabChange}
        sx={{ 
          borderRight: 1, 
          borderColor: 'divider', 
          backgroundColor: theme.palette.gray.dark,
          width: width > 700 ? '200px' : '100%',
          'button': {
            color: 'white'
          },
          '.MuiTab-root:empty': {
            textAlign: 'left', 
            width: '100%',
          }
        }}>
        <Tab label="History" />
        <Tab label="Goals" />
        <Tab label="Settings" />
      </Tabs>
      <Stack 
        sx={{ boxShadow: 10, backgroundColor: 'gray.main' }} 
        padding={5} 
        width={'100%'} 
        height={'100%'}>
        <TabPanel value={tabValue} index={0}>
          <Stack spacing={5} direction={width > 700 ?"row" : "column"} >
            <Box>
              <WeightLogger 
                weights={sortedWeights} 
                todaysWeight={todaysWeight}
                updateWeightHistory={evaluateDashboardData}
              />
              <LineGraph weights={sortedWeights} />
            </Box>

            <Box flexGrow={1}>
              <RecentWeightLogs weights={sortedWeights} /> 
            </Box>
          </Stack> 
      </TabPanel>
      <TabPanel value={tabValue} index={1}>
        { sortedWeights.length ? 
          <Goals 
            updateGoals={evaluateDashboardData} 
            goals={goals} 
            mostRecentWeight={sortedWeights[0]} /> : 
          <Stack>
            <Typography variant="h5">Goals</Typography>
            <Typography marginTop={3}>Record at least one weight to add a goal.</Typography>
          </Stack> }
      </TabPanel>
      <TabPanel value={tabValue} index={2}>
        <Settings />
      </TabPanel>

      <GoalNotifier upcomingGoal={upcomingGoal} />

      </Stack>
      <Snackbar
        open={!!snackBarMessage.length}
        autoHideDuration={6000}
        onClose={() => setSnackBarMessage('')}
        message={snackBarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Stack> 
  )
}

const mapStateToProps = state => {
  return {
    userLoggedIn: state.userLoggedIn,
    uid: state.uid,
  }
}

export default connect(mapStateToProps)(Dashboard);

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}