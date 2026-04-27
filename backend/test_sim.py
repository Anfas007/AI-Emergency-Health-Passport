import urllib.request, json
def post(url, d, headers={}):
  h=headers.copy(); h['Content-Type']='application/json'
  req=urllib.request.Request(url, data=json.dumps(d).encode(), headers=h, method='POST')
  return json.loads(urllib.request.urlopen(req).read().decode())
def get(url, headers={}):
  req=urllib.request.Request(url, headers=headers); return json.loads(urllib.request.urlopen(req).read().decode())

su=post('http://127.0.0.1:8000/auth/patient-signup', {'name':'ztest', 'email':'ztest23@a.com', 'password':'abc'})
print('SIGNUP',su)
p_tok=post('http://127.0.0.1:8000/auth/patient-login', {'email':'ztest23@a.com','password':'abc'})['access_token']
d_tok=post('http://127.0.0.1:8000/auth/login', {'email':'doctor@hospital.com','password':'password123'})['access_token']
p_id=su['patient_id']
rc=post('http://127.0.0.1:8000/patients/request-consent/' + p_id, {}, {'Authorization':'Bearer ' + d_tok})
print('REQ CONSENT', rc)
p_reqs=get('http://127.0.0.1:8000/auth/patient-me/consent-requests', {'Authorization':'Bearer ' + p_tok})
print('PATIENT APP SEES CONSENT:', len(p_reqs))
p_notifs=get('http://127.0.0.1:8000/auth/patient-me/notifications', {'Authorization':'Bearer ' + p_tok})
print('PATIENT NOTIFS:', len(p_notifs))
