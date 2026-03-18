-- RLS Policies for demat_requests
CREATE POLICY "Users can create their own demat requests" ON demat_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own demat requests" ON demat_requests FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all demat requests" ON demat_requests FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
CREATE POLICY "Admins can update all demat requests" ON demat_requests FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
);
